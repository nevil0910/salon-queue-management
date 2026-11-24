import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pool } from './db/pool.js'
import * as queue from './queueService.js'

const app=express(),port=Number(process.env.PORT??10000)
const allowedOrigins=new Set((process.env.FRONTEND_ORIGIN??'http://localhost:5173').split(',').map(x=>x.trim()).filter(Boolean))
app.disable('x-powered-by');app.use(helmet());app.use(cors({origin(origin,cb){if(!origin||allowedOrigins.has(origin))return cb(null,true);return cb(null,false)}}));app.use(express.json({limit:'32kb'}))
app.use('/api/auth',rateLimit({windowMs:15*60_000,limit:20,standardHeaders:true,legacyHeaders:false}))
app.get('/api/health',(_req,res)=>res.json({status:'ok'}))
app.get('/api/ready',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({status:'ready',database:'connected'})}catch(error){console.error('Readiness check failed',error);res.status(503).json({status:'not-ready'})}})

function tokenFrom(req){return (req.get('authorization')??'').replace(/^Bearer\s+/i,'')}
async function auth(req,res,next){try{req.staff=await queue.staffFromToken(tokenFrom(req));if(!req.staff)return res.status(401).json({error:'auth.required'});next()}catch(e){next(e)}}
function roles(...roles){return(req,res,next)=>{if(!roles.includes(req.staff?.role))return res.status(403).json({error:'auth.forbidden'});next()}}
function wrap(handler){return async(req,res,next)=>{try{const result=await handler(req,res);if(!res.headersSent)res.json(result??{ok:true})}catch(error){next(error)}}}

app.post('/api/auth/login',wrap(async(req,res)=>{const value=await queue.staffLogin(req.body?.email,req.body?.password);res.json(value)}))
app.post('/api/auth/logout',auth,wrap(async(req)=>queue.logout(tokenFrom(req))))
app.get('/api/public/catalog',wrap(queue.publicCatalog));app.get('/api/public/dashboard',wrap(queue.publicDashboard));app.get('/api/public/snapshot',wrap(queue.publicSnapshot))
app.post('/api/public/registrations',wrap((req,res)=>queue.register(req.body,'ONLINE')))
app.get('/api/customer/status/:token',wrap(async(req,res)=>{const result=await queue.status(req.params.token);if(!result)return res.status(404).json({error:'queue.entryMissing'});res.json(result)}))
app.post('/api/customer/status/:token/cancel',wrap((req,res)=>queue.cancelCustomer(req.params.token,req.body?.reason)))
app.get('/api/staff/dashboard',auth,wrap((req)=>queue.staffDashboard(req.staff)))
app.post('/api/staff/registrations',auth,roles('OWNER','RECEPTION'),wrap((req)=>queue.register(req.body,'WALK_IN')))
app.post('/api/staff/queue/call-next',auth,roles('OWNER','RECEPTION'),wrap(async(req)=>{const dash=await queue.dashboard();const {getNextCallableEntry}=await import('../src/lib/queueEngine.js');const next=getNextCallableEntry(dash.entries,dash.catalog);if(!next.entry)throw new Error('queue.noEligibleCustomer');return queue.mutateQueue(next.entry.id,'call',req.staff)}))
for(const action of ['call','start','complete','cancel','no-show'])app.post(`/api/staff/queue/:id/${action}`,auth,roles('OWNER','RECEPTION','BARBER'),wrap((req)=>queue.mutateQueue(req.params.id,action,req.staff)))
app.patch('/api/staff/barbers/:id',auth,roles('OWNER','BARBER'),wrap(async(req)=>{if(req.staff.role==='BARBER'&&req.staff.barber_id!==req.params.id)throw new Error('auth.forbidden');return queue.updateBarber(req.params.id,req.body)}))
app.post('/api/owner/services',auth,roles('OWNER'),wrap((req)=>queue.createService(req.body)))
app.patch('/api/owner/services/:id',auth,roles('OWNER'),wrap((req)=>queue.updateService(req.params.id,req.body)))
app.delete('/api/owner/services/:id',auth,roles('OWNER'),wrap((req)=>queue.archiveService(req.params.id)))
app.post('/api/owner/barbers',auth,roles('OWNER'),wrap((req)=>queue.createBarber(req.body)))
app.patch('/api/owner/barbers/:id',auth,roles('OWNER'),wrap((req)=>queue.updateBarber(req.params.id,req.body)))
app.delete('/api/owner/barbers/:id',auth,roles('OWNER'),wrap((req)=>queue.archiveBarber(req.params.id)))
app.patch('/api/owner/settings',auth,roles('OWNER'),wrap((req)=>queue.updateSettings(req.body)))
app.post('/api/owner/staff',auth,roles('OWNER'),wrap((req)=>queue.createStaff(req.body,req.staff)))

app.get('/api/events',async(req,res)=>{res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.flushHeaders?.();res.write('event: connected\ndata: {}\n\n');const client=await pool.connect();let open=true;const send=()=>{if(open)res.write('event: queue-updated\ndata: {}\n\n')};try{await client.query('LISTEN elite_queue_updates');client.on('notification',send);const ping=setInterval(()=>{if(open)res.write(': ping\n\n')},25_000);req.on('close',()=>{open=false;clearInterval(ping);client.release()})}catch(error){client.release();if(open)res.end()}})

app.use((_req,res)=>res.status(404).json({error:'not_found'}))
app.use((error,_req,res,_next)=>{if(error.code==='23505')return res.status(409).json({error:'validation.duplicatePhone'});if(error.code==='23503')return res.status(409).json({error:'queue.referenceConflict'});if(error.message==='auth.forbidden')return res.status(403).json({error:error.message});const known=/^(auth|queue|validation|join|salon)\./.test(error.message??'');if(known)return res.status(error.message.includes('conflict')?409:400).json({error:error.message});console.error('API request failed',error);return res.status(500).json({error:'api.internalError'})})

const server=app.listen(port,'0.0.0.0',()=>console.log(`ELITE API listening on 0.0.0.0:${port}`))
async function shutdown(signal){console.log(`Received ${signal}; closing API server`);server.close(async()=>{await pool.end();process.exit(0)});setTimeout(()=>process.exit(1),10_000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'))
