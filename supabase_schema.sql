-- ============================================================
-- FREEZYDOM — Script de base de datos completo
-- Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================

-- 1. PERFILES DE USUARIO (extiende auth.users de Supabase)
create table if not exists public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  email text not null,
  rol text not null default 'cliente' check (rol in ('admin', 'cliente')),
  telefono text,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CLIENTES
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  telefono text,
  direccion text,
  empresa text,
  notas text,
  activo boolean default true,
  usuario_id uuid references public.perfiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. MARCAS de equipos
create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activa boolean default true,
  created_at timestamptz default now()
);

-- 4. EQUIPOS de aire acondicionado
create table if not exists public.equipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  marca_id uuid references public.marcas(id),
  modelo text,
  btu integer,
  descripcion text,
  precio_base numeric(10,2) not null default 0,
  imagen_url text,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. SERVICIOS
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null default 0,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. MATERIALES
create table if not exists public.materiales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  unidad text default 'unidad',
  precio_unitario numeric(10,2) not null default 0,
  stock integer default 0,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. COTIZACIONES
create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  cliente_id uuid references public.clientes(id),
  creado_por uuid references public.perfiles(id),
  estado text not null default 'borrador' check (estado in ('borrador','enviada','aprobada','rechazada')),
  notas text,
  subtotal numeric(10,2) default 0,
  descuento numeric(10,2) default 0,
  itbis numeric(10,2) default 0,
  total numeric(10,2) default 0,
  incluye_itbis boolean default false,
  fecha_validez date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. ITEMS DE COTIZACIÓN
create table if not exists public.cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid references public.cotizaciones(id) on delete cascade,
  tipo text not null check (tipo in ('equipo','servicio','material','otro')),
  referencia_id uuid,
  descripcion text not null,
  cantidad integer default 1,
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) generated always as (cantidad * precio_unitario) stored,
  created_at timestamptz default now()
);

-- 9. HISTORIAL DE PRECIOS (auditoría)
create table if not exists public.precio_historial (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  campo text not null default 'precio',
  precio_anterior numeric(10,2),
  precio_nuevo numeric(10,2),
  cambiado_por uuid references public.perfiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- FUNCIÓN: auto-actualizar updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para updated_at
create trigger trg_perfiles_updated before update on public.perfiles for each row execute function public.set_updated_at();
create trigger trg_clientes_updated before update on public.clientes for each row execute function public.set_updated_at();
create trigger trg_equipos_updated before update on public.equipos for each row execute function public.set_updated_at();
create trigger trg_servicios_updated before update on public.servicios for each row execute function public.set_updated_at();
create trigger trg_materiales_updated before update on public.materiales for each row execute function public.set_updated_at();
create trigger trg_cotizaciones_updated before update on public.cotizaciones for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCIÓN: auto-crear número de cotización (COT-0001, COT-0002...)
-- ============================================================
create or replace function public.generar_numero_cotizacion()
returns trigger as $$
declare
  ultimo integer;
begin
  select coalesce(max(cast(substring(numero from 5) as integer)), 0)
  into ultimo from public.cotizaciones where numero like 'COT-%';
  new.numero = 'COT-' || lpad(cast(ultimo + 1 as text), 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_numero_cotizacion
  before insert on public.cotizaciones
  for each row execute function public.generar_numero_cotizacion();

-- ============================================================
-- FUNCIÓN: auto-crear perfil al registrar usuario en Auth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Seguridad por fila
-- ============================================================

alter table public.perfiles enable row level security;
alter table public.clientes enable row level security;
alter table public.equipos enable row level security;
alter table public.servicios enable row level security;
alter table public.materiales enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.cotizacion_items enable row level security;
alter table public.precio_historial enable row level security;
alter table public.marcas enable row level security;

-- Función auxiliar para obtener el rol del usuario actual
create or replace function public.mi_rol()
returns text as $$
  select rol from public.perfiles where id = auth.uid();
$$ language sql stable security definer;

-- PERFILES: cada quien ve el suyo, admins ven todos
create policy "perfiles_select" on public.perfiles for select using (id = auth.uid() or public.mi_rol() = 'admin');
create policy "perfiles_update" on public.perfiles for update using (id = auth.uid() or public.mi_rol() = 'admin');

-- CATÁLOGO (equipos, servicios, materiales, marcas): todos los autenticados pueden leer, solo admins modifican
create policy "equipos_select" on public.equipos for select using (auth.uid() is not null);
create policy "equipos_admin" on public.equipos for all using (public.mi_rol() = 'admin');

create policy "servicios_select" on public.servicios for select using (auth.uid() is not null);
create policy "servicios_admin" on public.servicios for all using (public.mi_rol() = 'admin');

create policy "materiales_select" on public.materiales for select using (auth.uid() is not null);
create policy "materiales_admin" on public.materiales for all using (public.mi_rol() = 'admin');

create policy "marcas_select" on public.marcas for select using (auth.uid() is not null);
create policy "marcas_admin" on public.marcas for all using (public.mi_rol() = 'admin');

-- CLIENTES: admins ven todos, clientes ven solo el suyo
create policy "clientes_admin" on public.clientes for all using (public.mi_rol() = 'admin');
create policy "clientes_select_propio" on public.clientes for select using (usuario_id = auth.uid());

-- COTIZACIONES: admins ven todas, clientes ven solo las suyas
create policy "cotizaciones_admin" on public.cotizaciones for all using (public.mi_rol() = 'admin');
create policy "cotizaciones_cliente" on public.cotizaciones for select
  using (cliente_id in (select id from public.clientes where usuario_id = auth.uid()));

create policy "items_admin" on public.cotizacion_items for all using (public.mi_rol() = 'admin');
create policy "items_cliente" on public.cotizacion_items for select
  using (cotizacion_id in (
    select c.id from public.cotizaciones c
    join public.clientes cl on c.cliente_id = cl.id
    where cl.usuario_id = auth.uid()
  ));

-- HISTORIAL DE PRECIOS: solo admins
create policy "historial_admin" on public.precio_historial for all using (public.mi_rol() = 'admin');

-- ============================================================
-- DATOS INICIALES — Servicios base de FreezyDom
-- ============================================================
insert into public.servicios (nombre, descripcion, precio, activo) values
  ('Instalación', 'Instalación completa de unidad de aire acondicionado', 3500.00, true),
  ('Mantenimiento preventivo', 'Limpieza y revisión completa del equipo', 1500.00, true),
  ('Reparación', 'Diagnóstico y reparación de fallas', 2000.00, true),
  ('Diagnóstico', 'Evaluación técnica del equipo', 800.00, true),
  ('Desinstalación', 'Desmontaje del equipo', 1200.00, true),
  ('Reubicación', 'Traslado e instalación en nueva ubicación', 4000.00, true)
on conflict do nothing;

-- Marcas base
insert into public.marcas (nombre, activa) values
  ('LG', true), ('Samsung', true), ('Carrier', true), ('York', true),
  ('Midea', true), ('Gree', true), ('Daikin', true), ('Mitsubishi', true)
on conflict do nothing;

-- Materiales base
insert into public.materiales (nombre, unidad, precio_unitario, activo) values
  ('Tubería de cobre 1/4"', 'pie', 45.00, true),
  ('Tubería de cobre 3/8"', 'pie', 55.00, true),
  ('Tubería de cobre 1/2"', 'pie', 70.00, true),
  ('Cable eléctrico #10', 'pie', 18.00, true),
  ('Cable eléctrico #12', 'pie', 14.00, true),
  ('Canaleta 40x25mm', 'pie', 35.00, true),
  ('Canaleta 60x40mm', 'pie', 55.00, true),
  ('Breaker 20A', 'unidad', 450.00, true),
  ('Breaker 30A', 'unidad', 550.00, true),
  ('Gas refrigerante R410A', 'libra', 350.00, true),
  ('Gas refrigerante R22', 'libra', 280.00, true),
  ('Soporte de pared', 'unidad', 350.00, true),
  ('Soporte de piso', 'unidad', 650.00, true),
  ('Drenaje flexible', 'pie', 25.00, true),
  ('Cinta aislante', 'rollo', 85.00, true)
on conflict do nothing;

-- ============================================================
-- ¡LISTO! Base de datos de FreezyDom configurada exitosamente.
-- Próximo paso: Crear el primer usuario administrador en
-- Supabase → Authentication → Users → Add User
-- ============================================================
