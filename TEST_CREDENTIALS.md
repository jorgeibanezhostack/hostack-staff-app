# 🧪 Hostack Staff App - Test Credentials

## Demo Mode Active ✅

La aplicación permite **modo demo** sin necesidad de Supabase. Perfecto para testing.

### Credenciales de Prueba

#### **Opción 1: Login Rápido (Demo Mode)**
- **Email**: `staff@demo.co` (cualquier email válido funciona)
- **Password**: `demo123` (mínimo 4 caracteres)

#### **Opción 2: Cualquier credencial**
El modo demo acepta:
- **Email**: Cualquier email válido (ej: `juan@test.co`, `maria@hostel.com`)
- **Password**: Cualquier password con 4+ caracteres

### 🎯 Flujo de Prueba Recomendado

1. **Accede a**: https://hostack-staff-app.vercel.app/
2. **Email**: `manager@torridonia.co`
3. **Password**: `test1234`
4. Haz clic en **"Sign In"**
5. ✅ Deberías estar dentro del dashboard

### 📋 Secciones Disponibles en Demo

- ✅ **Shift Checklist** - Checklists de turno
- 🚨 **Incident Report** - Reportar incidentes
- 📚 **Playbooks** - Guías operacionales
- 💬 **Bot QA** - Asistente inteligente
- 👑 **Admin** (solo manager) - Panel de administración

### ⚙️ Cómo Funciona el Demo Mode

Cuando `VITE_SUPABASE_URL` no está configurado en el navegador:
1. El login **no requiere Supabase**
2. Las credenciales se guardan en `localStorage` como `staff_demo_session`
3. Todos los datos son locales (no persisten entre sessiones)
4. Perfecto para UI/UX testing sin backend

### 🧑‍💼 Roles Disponibles en Futura Integración

- `Housekeeping` - Personal de limpieza
- `Reception` - Recepcionista
- `Maintenance` - Mantenimiento
- `Team Leader` - Líder de equipo (acceso Admin)
- `Manager` - Gerente (acceso Admin)

---

**Última actualización**: Abril 2026
**Estado**: ✅ Ready for Torridonia Staff Testing
