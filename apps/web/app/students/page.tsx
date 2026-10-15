'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDesktopRuntime } from '@/lib/local/tauri'
import StudentManager from './student-manager'
import LocalStudentManager from './local-student-manager'

// Client page so it works in the static desktop export (ARCH-3).
// Desktop -> local SQLite. Web browser -> existing cloud screen.
export default function StudentsPage() {
  const [mode, setMode] = useState<'pending' | 'desktop' | 'web'>('pending')
  useEffect(() => { setMode(isDesktopRuntime() ? 'desktop' : 'web') }, [])
  if (mode === 'pending') return null
  return mode === 'desktop' ? <LocalStudentManager /> : <CloudStudents />
}

type ManagerProps = ComponentProps<typeof StudentManager>

function CloudStudents() {
  const [props, setProps] = useState<ManagerProps | null>(null)
  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
      const organizationId = membership?.organization_id
      if (!organizationId) { window.location.href = '/onboarding'; return }
      const [{ data: students }, { data: programs }, { data: levels }, { data: years }] = await Promise.all([
        supabase.from('students').select('id,student_number,first_name,last_name,sex,date_of_birth,phone,email,address,parent_name,parent_phone,program_id,level_id,academic_year_id,status,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }),
        supabase.from('programs').select('id,name,code').eq('organization_id', organizationId).eq('is_active', true).order('name'),
        supabase.from('levels').select('id,name,code').eq('organization_id', organizationId).eq('is_active', true).order('ordinal'),
        supabase.from('academic_years').select('id,name').eq('organization_id', organizationId).order('is_current', { ascending: false }).order('starts_on', { ascending: false }),
      ])
      setProps({ organizationId, initialStudents: students ?? [], programs: programs ?? [], levels: levels ?? [], years: years ?? [] })
    })()
  }, [])
  return props ? <StudentManager {...props} /> : null
}
