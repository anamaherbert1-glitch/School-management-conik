-- CONIK RBAC/RLS hardening
-- Applied to the School management conik Supabase project.

create or replace function public.has_org_permission(target_org_id uuid, permission_code text)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.organization_members m
    join public.roles r on r.id=m.role_id
    join public.role_permissions rp on rp.role_id=r.id
    join public.permissions p on p.id=rp.permission_id
    where m.organization_id=target_org_id
      and m.user_id=public.current_user_id()
      and m.status='active' and p.code=permission_code
  )
$$;

-- Existing broad member policies are replaced by permission-based access.
-- Academic configuration
 drop policy if exists class_groups_member_all on public.class_groups;
 drop policy if exists class_groups_org_access on public.class_groups;
 create policy class_groups_select on public.class_groups for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy class_groups_write on public.class_groups for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 drop policy if exists departments_member_all on public.departments;
 create policy departments_select on public.departments for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy departments_write on public.departments for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 drop policy if exists levels_member_all on public.levels;
 create policy levels_select on public.levels for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy levels_write on public.levels for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 drop policy if exists programs_member_all on public.programs;
 create policy programs_select on public.programs for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy programs_write on public.programs for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 drop policy if exists subjects_member_all on public.subjects;
 create policy subjects_select on public.subjects for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy subjects_write on public.subjects for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 drop policy if exists program_subjects_member_all on public.program_subjects;
 create policy program_subjects_select on public.program_subjects for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy program_subjects_write on public.program_subjects for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 drop policy if exists rooms_member_all on public.rooms;
 create policy rooms_select on public.rooms for select to authenticated using (public.has_org_permission(organization_id,'settings.manage'));
 create policy rooms_write on public.rooms for all to authenticated using (public.has_org_permission(organization_id,'settings.manage')) with check (public.has_org_permission(organization_id,'settings.manage'));

 -- People
 drop policy if exists teachers_member_all on public.teachers;
 create policy teachers_select on public.teachers for select to authenticated using (public.has_org_permission(organization_id,'users.manage'));
 create policy teachers_write on public.teachers for all to authenticated using (public.has_org_permission(organization_id,'users.manage')) with check (public.has_org_permission(organization_id,'users.manage'));

 drop policy if exists teacher_subject_org_access on public.teacher_subject_assignments;
 create policy teacher_subject_select on public.teacher_subject_assignments for select to authenticated using (public.has_org_permission(organization_id,'users.manage'));
 create policy teacher_subject_write on public.teacher_subject_assignments for all to authenticated using (public.has_org_permission(organization_id,'users.manage')) with check (public.has_org_permission(organization_id,'users.manage'));

 drop policy if exists students_select on public.students;
 drop policy if exists students_admin_insert on public.students;
 drop policy if exists students_admin_update on public.students;
 create policy students_view on public.students for select to authenticated using (public.has_org_permission(organization_id,'students.view'));
 create policy students_manage on public.students for all to authenticated using (public.has_org_permission(organization_id,'students.manage')) with check (public.has_org_permission(organization_id,'students.manage'));

 drop policy if exists student_documents_org_access on public.student_documents;
 create policy student_documents_view on public.student_documents for select to authenticated using (public.has_org_permission(organization_id,'documents.view'));
 create policy student_documents_manage on public.student_documents for all to authenticated using (public.has_org_permission(organization_id,'documents.manage')) with check (public.has_org_permission(organization_id,'documents.manage'));

 -- Grades and bulletins
 drop policy if exists assessments_org_access on public.assessments;
 create policy assessments_select on public.assessments for select to authenticated using (public.has_org_permission(organization_id,'grades.view'));
 create policy assessments_write on public.assessments for all to authenticated using (public.has_org_permission(organization_id,'grades.manage')) with check (public.has_org_permission(organization_id,'grades.manage'));

 drop policy if exists grades_org_access on public.grades;
 create policy grades_select on public.grades for select to authenticated using (public.has_org_permission(organization_id,'grades.view'));
 create policy grades_write on public.grades for all to authenticated using (public.has_org_permission(organization_id,'grades.manage')) with check (public.has_org_permission(organization_id,'grades.manage'));

 drop policy if exists bulletin_templates_org_access on public.bulletin_templates;
 create policy bulletin_templates_select on public.bulletin_templates for select to authenticated using (public.has_org_permission(organization_id,'documents.view'));
 create policy bulletin_templates_write on public.bulletin_templates for all to authenticated using (public.has_org_permission(organization_id,'documents.manage')) with check (public.has_org_permission(organization_id,'documents.manage'));

 drop policy if exists generated_bulletins_org_access on public.generated_bulletins;
 create policy generated_bulletins_select on public.generated_bulletins for select to authenticated using (public.has_org_permission(organization_id,'documents.view'));
 create policy generated_bulletins_write on public.generated_bulletins for all to authenticated using (public.has_org_permission(organization_id,'documents.manage')) with check (public.has_org_permission(organization_id,'documents.manage'));

 -- Membership metadata is authenticated-only.
 drop policy if exists members_select_member on public.organization_members;
 create policy members_select_member on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
 drop policy if exists roles_select_member on public.roles;
 create policy roles_select_member on public.roles for select to authenticated using (public.is_org_member(organization_id));
 drop policy if exists role_permissions_read_member on public.role_permissions;
 create policy role_permissions_read_member on public.role_permissions for select to authenticated using (exists (select 1 from public.organization_members om where om.user_id=public.current_user_id() and om.role_id=role_permissions.role_id and om.status='active'));

 -- Profile access is self-only.
 drop policy if exists profiles_select_self on public.profiles;
 drop policy if exists profiles_update_self on public.profiles;
 create policy profiles_select_self on public.profiles for select to authenticated using (id=public.current_user_id());
 create policy profiles_update_self on public.profiles for update to authenticated using (id=public.current_user_id()) with check (id=public.current_user_id());

 -- Organization access.
 drop policy if exists organizations_select_member on public.organizations;
 drop policy if exists organizations_update_member on public.organizations;
 create policy organizations_select_member on public.organizations for select to authenticated using (public.is_org_member(id));
 create policy organizations_update_admin on public.organizations for update to authenticated using (public.has_org_permission(id,'settings.manage')) with check (public.has_org_permission(id,'settings.manage'));

 -- Remove anonymous execution from privileged helper functions.
 create or replace function public.current_user_id() returns uuid language sql stable set search_path=public
 as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 revoke execute on function public.has_org_permission(uuid,text) from anon,authenticated;
 revoke execute on function public.seed_organization_roles() from anon,authenticated;
 revoke execute on function public.seed_organization_roles_for_existing(uuid) from anon,authenticated;
 revoke execute on function public.rls_auto_enable() from anon,authenticated;
 revoke execute on function public.calculate_class_averages(uuid,uuid) from anon;
 revoke execute on function public.create_enrollment(uuid,uuid,uuid,uuid,uuid,text) from anon;
 revoke execute on function public.create_school_for_current_user(text,text,text,text,text,text,text) from anon;
 revoke execute on function public.prepare_bulletin_payload(uuid,uuid,uuid,uuid,uuid,text) from anon;
