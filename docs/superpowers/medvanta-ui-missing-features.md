# MedVanta UI — features faltantes (HTML vs vantaverse-admin)

Comparación de `VantaThrive-admin-MedVanta-rebuild-v6.html` (24 vistas: 15 screens + 9 modales) contra el proyecto `vantaverse-admin`, orientada a migrar la interfaz nueva: qué se puede portar con datos existentes, qué conviene stub/ocultar, y qué saltar.

`audit` del HTML es meta del prototipo → ignorar.

---

## Ya existe en el admin (migrar UI, no inventar feature)

| Prototipo | Admin actual |
|-----------|--------------|
| Dashboard | `/` (`StatusCounts`, `Compliance`, `NeedingAttention`) |
| Members | `/users` |
| Member profile | `/users/[id]` |
| Groups / Group detail | `/groups`, `/groups/[id]` |
| Programs / Builder / Build workout | `/builder`, `/builder/[id]` (+ workout schedule) |
| Exercises | `/exercises` |
| Messages (inbox básico) | `/messages` |
| Invite | `AddUserModal` (+ pestaña CSV) |
| Assign program / group | `AssignProgramModal`, `AssignGroupModal` |
| Change onboarding | `ChangeOnboardingDialog` |
| Add group members | `AddMembersModal` |
| Edit exercise / day / save derived | `ExerciseModal`, `ExerciseBuilderModal`, `UpdateDerivedDialog` |
| Intake (lectura) | `mc-intake-card` (solo lectura) |
| Appointment (en perfil) | `appointment-card` |

---

## Features del HTML que no están (o casi no) en el proyecto

Candidatas a **saltar** o **parche temporal** con información existente.

### Páginas / modos de pantalla

1. **OTP MedVanta (`login` + `otp`)**  
   Flujo email→código del HTML. Admin: login distinto; `sign-in` tiene SSO, no OTP del prototipo.  
   *Temporal:* seguir auth actual (SSO/sign-in).

2. **Perfil “program due” / “overdue” (`member-due`, `member-overdue`)**  
   Modos con SLA (extender deadline, reasignar owner). En perfil actual: sin acciones SLA/`due`/`overdue`.  
   *Temporal:* badge/filtro con `program_due_date` si existe; sin botones de mutación.

3. **Review & assign (`scReviewAssign` / vista `review`)**  
   Paso “Before you assign” + push de schedule a miembros. No hay ruta ni wizard equivalente.  
   *Temporal:* guardar template en builder + asignar miembro a miembro con `AssignProgramModal`.

### Modales / pestañas / sub-features

4. **Intake survey modal (`m-intake` / `mdIntakeSurvey`)**  
   Overlay completo Q&A. Solo hay card de lectura.  
   *Temporal:* mostrar `mc-intake-card`; omitir “editar/ver survey” como modal.

5. **Clinical notes (`memberNotesTab`)**  
   Add/edit/delete notes staff-only. Cero UI de notes en perfil.  
   *Saltar* hasta haber modelo; no hay datos existentes que pintar.

6. **Group → Scheduling (`groupSchedulingTab`)**  
   Booking links Calendly, calendar de citas del grupo, reglas de physiologist. Group detail no tiene scheduling/Calendly/booking.  
   *Temporal:* citas solo en perfil de usuario (`appointment-card`); omitir tab de grupo.

7. **Group → Settings (domain / logo / booking URLs)**  
   No aparece en group UI.  
   *Saltar* o dejar solo name/description/picture si ya existen.

8. **Messages → saved replies + attach file**  
   HTML: “Insert a saved reply”, “Attach a file”. Admin messages: básicamente unread/hilos.  
   *Temporal:* compose/texto plano; ocultar saved replies y attachments.

9. **Dashboard → Onboarding funnel + Recent activity (24h)**  
   HTML tiene funnel de 5 gates + activity feed. Admin tiene counts / compliance / needing-attention, no funnel ni activity log.  
   *Temporal:* quedarse con las 3 cards actuales; no pintar funnel/activity vacíos.

10. **Bulk actions en Members** (además de invite)  
    Bulk assign program / add to group / export / remove. Invite+CSV sí; el resto no.  
    *Temporal:* solo invite/CSV; acciones 1:1 desde perfil.

11. **Program template ops del HTML** (duplicate / archive / push schedule a existentes)  
    Ligadas a `review`. No hay flujo de producto equivalente.  
    *Saltar* o solo “crear/editar” en `/builder`.

12. **Exercise partner library import + saved exercise blocks (day editor)**  
    Overflow del HTML; no hay UI/RPC de partner import ni bloques guardados.  
    *Saltar*; day editor actual sin “saved blocks”.

13. **Filter panel como vista propia (`m-filters`)**  
    Chrome del prototipo.  
    *No es feature de dominio* — filtros inline donde ya existan.

---

## Resumen para migración de interfaz

| Acción | Qué |
|--------|-----|
| **Migrar con datos actuales** | Dashboard (cards existentes), Users, Groups (miembros/programs básicos), Builder/workout, Exercises, Messages (inbox), modales assign/invite/onboarding/exercise/day/derived |
| **UI nueva pero feature incompleta → stub/ocultar** | Intake modal, due/overdue SLA, review&assign, funnel, activity feed, group scheduling/settings, saved replies/attachments, bulk ops, notes |
| **No portar** | `audit`, partner exercise import, saved blocks, OTP MedVanta si auth actual basta |
