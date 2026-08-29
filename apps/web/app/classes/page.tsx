import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClassManager from './class-manager'

export default async function ClassesPage(){
 const sb=await createClient(); const {data:{user}}=await sb.auth.getUser(); if(!user) redirect('/login')
 const {data:m}=await sb.from('organization_members').select('organization_id').eq('user_id',user.id).maybeSingle(); const org=m?.organization_id; if(!org) redirect('/onboarding')
 const [{data:classes},{data:years},{data:levels},{data:programs},{data:assignments}]=await Promise.all([
  sb.from('class_groups').select('id,name,code,capacity,is_active,academic_year_id,level_id,program_id').eq('organization_id',org).order('name'),
  sb.from('academic_years').select('id,name,is_current').eq('organization_id',org).order('is_current',{ascending:false}).order('starts_on',{ascending:false}),
  sb.from('levels').select('id,name,code').eq('organization_id',org).eq('is_active',true).order('ordinal'),
  sb.from('programs').select('id,name,code').eq('organization_id',org).eq('is_active',true).order('name'),
  sb.from('student_class_assignments').select('id,class_group_id,enrollment_id,status').eq('organization_id',org).eq('status','active')
 ])
 return <ClassManager organizationId={org} initialClasses={classes??[]} years={years??[]} levels={levels??[]} programs={programs??[]} initialAssignments={assignments??[]}/>
}
