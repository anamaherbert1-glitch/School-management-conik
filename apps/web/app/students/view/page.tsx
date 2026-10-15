'use client'

import { Suspense, useEffect, useState, type ComponentProps } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDesktopRuntime } from '@/lib/local/tauri'
import StudentDossier from '../student-dossier'
import LocalStudentDossier from '../local-student-dossier'

// Replaces /students/[id]: a dynamic segment cannot be statically exported for the desktop app.
export default function StudentViewPage() {
  return <Suspense fallback={null}><StudentView /></Suspense>
}

function StudentView() {
  const id = useSearchParams().get('id') || ''
  const [mode, setMode] = useState<'pending' | 'desktop' | 'web'>('pending')
  useEffect(() => { setMode(isDesktopRuntime() ? 'desktop' : 'web') }, [])
  if (!id) return <main className="students-page"><a className="back-link" href="/students/">← Étudiants</a><div className="students-empty"><strong>Aucun étudiant sélectionné</strong></div></main>
  if (mode === 'pending') return null
  return mode === 'desktop' ? <LocalStudentDossier id={id} /> : <CloudDossier id={id} />
}

type DossierProps = ComponentProps<typeof StudentDossier>

function CloudDossier({ id }: { id: string }) {
  const [props, setProps] = useState<DossierProps | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
      if (!member?.organization_id) { window.location.href = '/onboarding'; return }
      const org = member.organization_id
      const [{ data: student }, { data: documents }, { data: enrollments }, { data: years }, { data: grades }, { data: assessments }, { data: subjects }, { data: bulletins }] = await Promise.all([
        supabase.from('students').select('*').eq('id', id).eq('organization_id', org).maybeSingle(),
        supabase.from('student_documents').select('*').eq('student_id', id).eq('organization_id', org).order('created_at', { ascending: false }),
        supabase.from('student_enrollments').select('id,enrollment_number,academic_year_id,program_id,level_id,status,enrollment_date').eq('student_id', id).eq('organization_id', org).order('enrollment_date', { ascending: false }),
        supabase.from('academic_years').select('id,name').eq('organization_id', org).order('starts_on', { ascending: false }),
        supabase.from('grades').select('id,value,comment,assessment_id').eq('student_id', id).eq('organization_id', org),
        supabase.from('assessments').select('id,subject_id,title,assessment_type,max_value,coefficient,assessment_date').eq('organization_id', org),
        supabase.from('subjects').select('id,name,coefficient').eq('organization_id', org),
        supabase.from('generated_bulletins').select('id,template_id,academic_year_id,period,generated_at,template_version,status,payload').eq('student_id', id).eq('organization_id', org).order('generated_at', { ascending: false }),
      ])
      if (!student) { setMissing(true); return }
      setProps({ organizationId: org, student, documents: documents ?? [], enrollments: enrollments ?? [], years: years ?? [], grades: grades ?? [], assessments: assessments ?? [], subjects: subjects ?? [], bulletins: bulletins ?? [] })
    })()
  }, [id])
  if (missing) return <main className="students-page"><a className="back-link" href="/students/">← Étudiants</a><div className="students-empty"><strong>Dossier introuvable</strong></div></main>
  return props ? <StudentDossier {...props} /> : null
}
