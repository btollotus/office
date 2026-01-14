import { NextResponse } from 'next/server';
import { requireAdmin } from '../_utils';

function normEmail(email: string) {
  return String(email ?? '').trim().toLowerCase();
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { adminDb } = guard;

  const { data, error } = await adminDb
    .from('employees')
    .select('id,email,full_name,phone,status,profile_id,created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { adminDb } = guard;

  const body = await req.json().catch(() => ({}));
  const email = normEmail(body.email);
  const full_name = String(body.full_name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const status = (String(body.status ?? 'pending') as 'pending' | 'active' | 'disabled');

  if (!email.includes('@') || !full_name) {
    return NextResponse.json({ ok: false, message: 'email/full_name required' }, { status: 400 });
  }

  const { data, error } = await adminDb
    .from('employees')
    .insert([{ email, full_name, phone, status }])
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
