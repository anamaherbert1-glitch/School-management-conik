import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentDossier from './student-dossier'

export default async function StudentDossierPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login')
 const {data:member}=await supabase.from('organization_members').select('organization_id').eq('user_id',user.id).maybeSingle(); if(!member?.organization_id) redirect('/onboarding')
 const [{data:student},{data:documents},{data:enrollments},{data:years},{data:grades},{data:assessments},{data:subjects},{data:bulletins}] = await Promise.all([
  supabase.from('students').select('*').eq('id',id).eq('organization_id',member.organization_id).maybeSingle(),
  supabase.from('student_documents').select('*').eq('student_id',id).eq('organization_id',member.organization_id).order('created_at',{ascending:false}),
  supabase.from('student_enrollments').select('id,enrollment_number,academic_year_id,program_id,level_id,status,enrollment_date').eq('student_id',id).eq('organization_id',member.organization_id).order('enrollment_date',{ascending:false}),
  supabase.from('academic_years').select('id,name').eq('organization_id',member.organization_id).order('starts_on',{ascending:false}),
  supabase.from('grades').select('id,value,comment,assessment_id').eq('student_id',id).eq('organization_id',member.organization_id),
  supabase.from('assessments').select('id,subject_id,title,assessment_type,max_value,coefficient,assessment_date').eq('organization_id',member.organization_id),
  supabase.from('subjects').select('id,name,coefficient').eq('organization_id',member.organization_id),
  supabase.from('generated_bulletins').select('id,template_id,academic_year_id,period,generated_at,template_version,status,payload').eq('student_id',id).eq('organization_id',member.organization_id).order('generated_at',{ascending:false})
 ])
 if(!student) notFound()
 return <StudentDossier organizationId={member.organization_id} student={student} documents={documents??[]} enrollments={enrollments??[]} years={years??[]} grades={grades??[]} assessments={assessments??[]} subjects={subjects??[]} bulletins={bulletins??[]} />
}