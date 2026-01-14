import { NextResponse } from 'next/server';
import { requireAdmin } from '../_utils';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { adminDb } = guard;

  const body = await req.json().catch(() => ({}));
  const patch: any = {};

  if (body.full_name !== undefined) patch.full_name = String(body.full_name).trim();
  if (body.phone !== undefined) patch.phone = String(body.phone).trim();
  if (body.status !== undefined) patch.status = String(body.status);

  const { data, error } = await adminDb
    .from('employees')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { adminDb } = guard;

  const { error } = await adminDb.from('employees').delete().eq('id', params.id);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
