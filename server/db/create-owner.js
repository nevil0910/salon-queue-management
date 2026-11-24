import bcrypt from 'bcryptjs'
import { pool } from './pool.js'
const email=process.env.OWNER_EMAIL,password=process.env.OWNER_PASSWORD
if(!email||!password||password.length<12){console.error('Set OWNER_EMAIL and OWNER_PASSWORD (at least 12 characters).');process.exitCode=1}
else{try{const hash=await bcrypt.hash(password,12);await pool.query("INSERT INTO staff_accounts(salon_id,email,password_hash,role) VALUES($1,lower($2),$3,'OWNER') ON CONFLICT(salon_id,email) DO UPDATE SET password_hash=EXCLUDED.password_hash,active=true,updated_at=now()",[process.env.SALON_ID??'elite-primary',email,hash]);console.log(`Owner account provisioned for ${email}`)}catch(error){console.error('Owner provisioning failed',error);process.exitCode=1}finally{await pool.end()}}
