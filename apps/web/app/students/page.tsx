import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentManager from './student-manager'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const organizationId = membership?.organization_id
  if (!organizationId) redirect('/onboarding')
  const [{ data: students }, { data: programs }, { data: levels }, { data: years }] = await Promise.all([
    supabase.from('students').select('id,student_number,first_name,last_name,sex,date_of_birth,phone,email,address,parent_name,parent_phone,program_id,level_id,academic_year_id,status,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }),
    supabase.from('programs').select('id,name,code').eq('organization_id', organizationId).eq('is_active', true).order('name'),
    supabase.from('levels').select('id,name,code').eq('organization_id', organizationId).eq('is_active', true).order('ordinal'),
    supabase.from('academic_years').select('id,name').eq('organization_id', organizationId).order('is_current', { ascending: false }).order('starts_on', { ascending: false }),
  ])
  return <StudentManager organizationId={organizationId} initialStudents={students ?? []} programs={programs ?? []} levels={levels ?? []} years={years ?? []} />
}
