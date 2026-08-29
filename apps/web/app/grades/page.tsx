import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GradeManager from './grade-manager'

export default async function GradesPage(){
 const sb=await createClient(); const {data:{user}}=await sb.auth.getUser(); if(!user) redirect('/login')
 const {data:membership}=await sb.from('organization_members').select('organization_id').eq('user_id',user.id).maybeSingle(); if(!membership?.organization_id) redirect('/onboarding')
 const org=membership.organization_id
 const [{data:classes},{data:years},{data:subjects},{data:semesters}]=await Promise.all([
  sb.from('class_groups').select('id,name,code,academic_year_id,level_id,program_id').eq('organization_id',org).eq('is_active',true).order('name'),
  sb.from('academic_years').select('id,name,is_current').eq('organization_id',org).order('is_current',{ascending:false}).order('starts_on',{ascending:false}),
  sb.from('subjects').select('id,name,code,coefficient').eq('organization_id',org).eq('is_active',true).order('name'),
  sb.from('academic_semesters').select('id,name,semester_number,academic_year_id').eq('organization_id',org).order('semester_number')
 ])
 return <GradeManager organizationId={org} classes={classes??[]} years={years??[]} subjects={subjects??[]} semesters={semesters??[]}/>
}
