import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SOPUpload from './SOPUpload'
import '../styles/Playbooks.css'

// Sistema de roles y permisos
const ROLE_PERMISSIONS = {
  'Team Leader': ['housekeeping', 'breakfast', 'team_leader', 'operations'],
  'Manager': ['housekeeping', 'breakfast', 'team_leader', 'operations', 'maintenance'],
  'Volunteer': ['housekeeping', 'breakfast', 'guest_service'],
  'Kitchen Staff': ['breakfast', 'guest_service'],
  'Housekeeping': ['housekeeping', 'guest_service'],
  'Maintenance': ['maintenance', 'operations'],
}

const DEMO_PLAYBOOKS = [
  // ─── CHECKLISTS: HOUSEKEEPING ───
  {
    id: 'check-main-bed-room',
    title: 'Main Bedroom Checklist',
    type: 'Checklist',
    category: 'Housekeeping',
    subcategory: 'Main Bedroom',
    role_tags: ['Volunteer', 'Housekeeping'],
    access_keys: ['housekeeping'],
    content_text: `# Main Bedroom Checklist

## Recursos Requeridos
- Sábanas limpias (2 juegos)
- Almohadas y fundas
- Colcha/Edredón
- Toallas (2 sets)
- Productos de limpieza
- Aspiradora
- Trapeador
- Detergentes suaves

## Pre-Llegada - Limpieza Profunda
- [ ] Cambiar sábanas completamente
- [ ] Lavar ropa de cama (ciclo delicado)
- [ ] Aspirar alfombra completamente
- [ ] Pasar plumero en todos los muebles
- [ ] Limpiar espejo y cristales
- [ ] Desinfectar manijas de puertas
- [ ] Limpiar baño adjunto
- [ ] Revisar aire acondicionado/calefacción
- [ ] Probar iluminación
- [ ] Stock amenities: jabón, champú, toallitas

## Durante Estadía
- [ ] Hacer cama diariamente
- [ ] Cambiar toallas si lo solicitan
- [ ] Vaciar bote de basura
- [ ] Limpiar rápidamente el espejo del baño
- [ ] Restock amenities si es necesario`,
    order_index: 1
  },
  {
    id: 'check-cottage-1',
    title: 'Cottage 1 (2-Bedroom) Checklist',
    type: 'Checklist',
    category: 'Housekeeping',
    subcategory: 'Cottage 1',
    role_tags: ['Volunteer', 'Housekeeping'],
    access_keys: ['housekeeping'],
    content_text: `# Cottage 1 Checklist - 2 Bedrooms

## Recursos Requeridos
- Sábanas (4 juegos - 2 camas)
- Almohadas y fundas (4)
- Edredones (2)
- Toallas (4 sets completos)
- Productos de limpieza multiusos
- Productos específicos para baños (2)
- Aspiradora
- Mopa y cubo

## Pre-Llegada - Limpieza Completa
- [ ] Limpiar entrada y porche
- [ ] Cambiar sábanas en ambas camas
- [ ] Aspirar todas las habitaciones
- [ ] Limpiar cocina: encimeras, fregadero, electrodomésticos
- [ ] Limpiar ambos baños completamente
- [ ] Pasar plumero en muebles
- [ ] Limpiar ventanas
- [ ] Revisar todos los radiadores/calefacción
- [ ] Probar luces en todas las habitaciones
- [ ] Stock de productos de limpieza bajo el fregadero

## Stock Inicial
- [ ] Café, té, azúcar, leche (si aplica)
- [ ] Papel higiénico (baños y cocina)
- [ ] Jabón para lavar platos
- [ ] Basuras limpias con forros nuevos`,
    order_index: 2
  },
  {
    id: 'check-breakfast-setup',
    title: 'Breakfast Setup Checklist',
    type: 'Checklist',
    category: 'Breakfast',
    subcategory: 'Preparación',
    role_tags: ['Kitchen Staff', 'Volunteer'],
    access_keys: ['breakfast'],
    content_text: `# Breakfast Setup & Service

## Materiales Requeridos
- Manteles limpios
- Servilletas de papel/tela
- Platos de desayuno
- Tazas y vasos
- Cubiertos (cuchara, tenedor, cuchillo)
- Cuchillo de mantequilla
- Vasos para jugo
- Tazas para té/café

## Preparación de Comedor (5:00 AM)
- [ ] Limpiar y despejar las mesas
- [ ] Colocar manteles limpios
- [ ] Disponer platos y cubiertos
- [ ] Colocar servilletas
- [ ] Llenar jarras de agua
- [ ] Colocar azúcar y edulcorantes
- [ ] Preparar estación de café/té

## Stock de Alimentos
- [ ] Café (molido fresco)
- [ ] Té (variedades)
- [ ] Leche fresca
- [ ] Mantequilla
- [ ] Mermelada/Conservas
- [ ] Pan tostado/Pan
- [ ] Cereales
- [ ] Huevos (si aplica)
- [ ] Frutas frescas

## Después del Servicio
- [ ] Limpiar y recoger todas las mesas
- [ ] Lavar platos y cubiertos
- [ ] Trapear el comedor
- [ ] Guardar productos perecederos`,
    order_index: 3
  },

  // ─── PLAYBOOKS/SOPs: HOUSEKEEPING ───
  {
    id: 'sop-room-cleaning',
    title: 'How to Clean Guest Rooms',
    type: 'Playbook/SOP',
    category: 'Housekeeping',
    subcategory: 'Procedimientos',
    role_tags: ['Volunteer', 'Housekeeping'],
    access_keys: ['housekeeping'],
    content_text: `# Guest Room Cleaning SOP

## Filosofía de Limpieza
Cada habitación debe estar lista para una foto de revista. Los huéspedes pagan premium por cleanliness y attention to detail.

## Pre-Llegada - Limpieza Profunda (2 horas)

### Fase 1: Preparar (10 min)
1. Abrir ventanas completamente
2. Retirar ropa de cama usada
3. Vaciar bote de basura
4. Reunir todos los suministros

### Fase 2: Limpiar (70 min)
1. Aspirar todas las áreas incluyendo bajo muebles
2. Pasar plumero en muebles y repisas
3. Limpiar espejos y cristales con sin rayas
4. Desinfectar manijas de puertas y light switches
5. Limpiar baño:
   - Limpiar inodoro (dentro y fuera)
   - Limpiar ducha/bañera
   - Secar completamente
   - Limpiar espejo
   - Secar piso

### Fase 3: Finalizar (30 min)
1. Hacer cama con esquinas hospitalarias
2. Disponer almohadas decorativas
3. Colocar toallas limpias
4. Stock amenities:
   - Jabón
   - Champú
   - Loción
   - Papel higiénico
5. Abrir cortinas/persianas
6. Proba AC/Calefacción
7. Inspección final: mira desde la puerta

## Presentación para Huéspedes
- Cama perfectamente hecha
- Baño impecable y seco
- Olor fresco (no químicos)
- Toallas esponjosas
- Luz natural/iluminación adecuada
- Temperatura confortable`,
    order_index: 4
  },
  {
    id: 'sop-cottage-cleaning',
    title: 'How to Clean Cottages',
    type: 'Playbook/SOP',
    category: 'Housekeeping',
    subcategory: 'Cottage Care',
    role_tags: ['Volunteer', 'Housekeeping'],
    access_keys: ['housekeeping'],
    content_text: `# Cottage Cleaning SOP

## Diferencias vs. Habitaciones Principales
- Más espacio (cocina + living + 2 bedrooms)
- Responsabilidad por cocina y áreas comunes
- Más detalles (ventanas, pisos, etc.)

## Ubicación de Insumos
- Productos de limpieza: Armario bajo el fregadero de la cocina
- Ropa de cama: Linen closet (puerta al final del pasillo)
- Toallas: Baño principal (armario sobre el inodoro)
- Papel/basuras: Almacén de mantenimiento (preguntar a Team Leader)

## Limpieza Completa (3-4 horas)

### Entrada & Áreas Comunes (45 min)
1. Limpiar puerta de entrada (adentro y afuera)
2. Barrer porche
3. Aspirar sala de estar
4. Pasar plumero en todos los muebles
5. Limpiar televisor y control remoto

### Cocina (60 min)
1. Limpiar microondas
2. Limpiar estufa y horno
3. Secar y limpiar fregadero
4. Limpiar encimera y espaldar
5. Secar pisos
6. Limpiar refrigerador (interior si está sucio)

### Baños (45 min por baño)
1. Limpiar ducha/bañera
2. Limpiar inodoro completamente
3. Limpiar lavamanos y espejo
4. Secar completamente
5. Limpiar pisos

### Dormitorios (60 min total)
1. Cambiar sábanas (ambas camas)
2. Aspirar completamente
3. Pasar plumero

## Presentación Final
- Puertas abiertas para ventilación
- Aroma fresco
- Todo seco
- Cortinas abiertas
- Luz adecuada
- Temperatura equilibrada`,
    order_index: 5
  },

  // ─── PLAYBOOKS/SOPs: BREAKFAST ───
  {
    id: 'sop-breakfast-prep',
    title: 'How to Prepare & Serve Breakfast',
    type: 'Playbook/SOP',
    category: 'Breakfast',
    subcategory: 'Servicio',
    role_tags: ['Kitchen Staff', 'Volunteer'],
    access_keys: ['breakfast'],
    content_text: `# Breakfast Preparation SOP

## Horarios Estándar
- Setup: 6:00 AM
- Servicio: 7:00-9:00 AM
- Limpieza: 9:30 AM

## Preparación del Comedor (6:00-6:30 AM)

### Setup
1. Limpiar todas las superficies
2. Colocar mantel limpio
3. Disponer platos, vasos, cubiertos
4. Servilletas en cada asiento
5. Agua fresca en jarras
6. Azúcar, edulcorantes, sal/pimienta

### Estación de Bebidas
1. Café recién hecho (molido fresco)
2. Agua caliente para té
3. Leche fría en jarra
4. Jugo fresco si aplica

## Preparación de Alimentos (6:30-7:00 AM)

### Proteína (si aplica)
- Huevos cocidos suavemente
- Espacio en tabla para cortar

### Pan & Tostadas
- Tostador listo
- Pan fresco disponible
- Mantequilla a temperatura ambiente

### Acompañamientos
- Mermeladas en platos pequeños
- Frutas frescas cortadas
- Queso fresco
- Jamón/Tocino si aplica

## Durante el Servicio (7:00-9:00 AM)

### Atención al Huésped
- Saludar calurosamente
- Preguntar preferencias
- Ser disponible para solicitudes
- Mantener bebidas llenas
- Esperar a que se terminen platos

### Mantenimiento
- Retirar platos vacíos inmediatamente
- Limpiar derrames
- Mantener estación de bebidas llena
- Mantener comedor limpio

## Limpieza Post-Servicio (9:30 AM)

### Comedor
1. Recoger platos y vasos
2. Sacudir migas
3. Trapear el piso
4. Guardar mantel en lavandería

### Cocina
1. Lavar todos los platos
2. Limpiar estufas/superficies
3. Guardar alimentos perecederos
4. Limpiar fregadero
5. Limpiar piso`,
    order_index: 6
  }
]

const STAFF_DATA_KEY = 'hostack_staff_session'

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState([])
  const [selectedPlaybook, setSelectedPlaybook] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [userRole, setUserRole] = useState('All')
  const [page, setPage] = useState('list') // 'list' | 'upload'
  const [loading, setLoading] = useState(true)
  const [usingSupabase, setUsingSupabase] = useState(false)

  // Try to detect actual staff role from session/localStorage
  const staffRole = localStorage.getItem('hostack_role') || 'Manager'
  const staffId = localStorage.getItem('hostack_staff_id') || null
  const isManager = ['Manager', 'Team Leader'].includes(staffRole)

  useEffect(() => {
    loadPlaybooks()
  }, [])

  async function loadPlaybooks() {
    setLoading(true)
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('property_id', '550e8400-e29b-41d4-a716-446655440000')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        // Normalize Supabase data to match existing shape
        const normalized = data.map(p => ({
          ...p,
          type: p.content_type || 'SOP',
          role_tags: p.role_tags || [],
          access_keys: p.access_keys || [],
          subcategory: p.subcategory || '',
          order_index: p.order_index || 0,
        }))
        setPlaybooks(normalized)
        setUsingSupabase(true)
      } else {
        // Fallback to demo data
        const saved = localStorage.getItem('staff_playbooks')
        setPlaybooks(saved ? JSON.parse(saved) : DEMO_PLAYBOOKS)
      }
    } catch {
      const saved = localStorage.getItem('staff_playbooks')
      setPlaybooks(saved ? JSON.parse(saved) : DEMO_PLAYBOOKS)
    } finally {
      setLoading(false)
    }
  }

  // Go to upload and return here after
  if (page === 'upload') {
    return (
      <SOPUpload
        staffId={staffId}
        staffRole={staffRole}
        onBack={() => { setPage('list'); loadPlaybooks() }}
      />
    )
  }

  const types = ['All', ...new Set(playbooks.map(p => p.type))]
  const categories = ['All', ...new Set(playbooks.map(p => p.category))]

  // Filter playbooks based on all criteria including role-based access
  const filtered = playbooks.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.content_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'All' || p.type === selectedType
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory

    // Role-based access control: check if user's role has access to this playbook
    let hasAccess = true
    if (userRole !== 'All') {
      const userPermissions = ROLE_PERMISSIONS[userRole] || []
      hasAccess = p.access_keys.some(key => userPermissions.includes(key))
    }

    return matchesSearch && matchesType && matchesCategory && hasAccess
  }).sort((a, b) => a.order_index - b.order_index)

  if (selectedPlaybook) {
    return (
      <div className="playbook-detail">
        <button className="btn-back" onClick={() => setSelectedPlaybook(null)}>
          ← Back to Playbooks
        </button>

        <div className="playbook-header">
          <span className="playbook-badge">{selectedPlaybook.category}</span>
          {selectedPlaybook.subcategory && (
            <span className="playbook-sub-badge">{selectedPlaybook.subcategory}</span>
          )}
          <span className="playbook-type">{selectedPlaybook.content_type}</span>
        </div>

        <h1>{selectedPlaybook.title}</h1>

        {selectedPlaybook.role_tags && selectedPlaybook.role_tags.length > 0 && (
          <div className="playbook-roles">
            <small>For: {selectedPlaybook.role_tags.join(', ')}</small>
          </div>
        )}

        <div className="playbook-content">
          {selectedPlaybook.content_text ? (
            <div className="markdown-content">
              {selectedPlaybook.content_text.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i}>{line.replace('## ', '')}</h2>
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i}>{line.replace('### ', '')}</h3>
                }
                if (line.startsWith('□ ')) {
                  return <div key={i} className="checkbox-line">{line}</div>
                }
                if (line.startsWith('- ')) {
                  return <li key={i}>{line.replace('- ', '')}</li>
                }
                if (line.match(/^[0-9]+\./)) {
                  return <li key={i}>{line}</li>
                }
                if (line.trim() === '') {
                  return <br key={i} />
                }
                return <p key={i}>{line}</p>
              })}
            </div>
          ) : (
            <p>No content available</p>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="playbooks-loading">⏳ Cargando documentos...</div>
  }

  return (
    <div className="playbooks-container">
      <div className="playbooks-header">
        <div className="playbooks-header-row">
          <div>
            <h1>Playbooks & SOPs</h1>
            <p>
              {usingSupabase
                ? `${playbooks.length} documento(s) en la base de datos`
                : 'Acceso rápido a guías y procedimientos'}
            </p>
          </div>
          {isManager && (
            <button className="btn-upload-sop" onClick={() => setPage('upload')}>
              + Subir SOP
            </button>
          )}
        </div>
      </div>

      <div className="playbooks-filters">
        <input
          type="text"
          placeholder="Search playbooks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="filter-group">
          <div className="filter-row">
            <div className="filter-select-wrapper">
              <label htmlFor="type-filter">Type:</label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="category-filter">Category:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="role-filter">Filter by Role:</label>
              <select
                id="role-filter"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Roles</option>
                {Object.keys(ROLE_PERMISSIONS).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="playbooks-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>📚 No playbooks found</p>
            <small>Try adjusting your filters or search term</small>
          </div>
        ) : (
          filtered.map(playbook => (
            <div
              key={playbook.id}
              className="playbook-card"
              onClick={() => setSelectedPlaybook(playbook)}
            >
              <div className="playbook-card-header">
                <h3>{playbook.title}</h3>
                <span className="playbook-type-small">{playbook.content_type}</span>
              </div>

              <p className="playbook-category">{playbook.category}</p>
              {playbook.subcategory && (
                <p className="playbook-subcategory">{playbook.subcategory}</p>
              )}

              {playbook.role_tags && playbook.role_tags.length > 0 && (
                <div className="playbook-tags">
                  {playbook.role_tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="playbook-preview">
                {playbook.content_text.split('\n')[0]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
