'use client';

import { useEffect, useMemo, useState } from 'react';

type Employee = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  status: 'pending' | 'active' | 'disabled';
  profile_id: string | null;
  created_at: string;
};

export default function AdminEmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const stats = useMemo(() => {
    const pending = items.filter((x) => x.status === 'pending').length;
    const active = items.filter((x) => x.status === 'active').length;
    const disabled = items.filter((x) => x.status === 'disabled').length;
    return { pending, active, disabled };
  }, [items]);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/employees', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? 'load failed');
      setItems(json.data);
    } catch (e: any) {
      setMsg(e?.message ?? '불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setMsg(null);
    const e = email.trim().toLowerCase();
    if (!e.includes('@') || !fullName.trim()) {
      setMsg('이메일/이름을 확인해 주세요.');
      return;
    }

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          full_name: fullName.trim(),
          phone: phone.trim(),
          status: 'pending',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? '추가 실패');

      setEmail('');
      setFullName('');
      setPhone('');
      await load();
      setMsg('✅ 직원 등록 완료 (pending)');
    } catch (e: any) {
      setMsg(e?.message ?? '추가 실패');
    }
  };

  const setStatus = async (id: string, status: Employee['status']) => {
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? '수정 실패');
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? '수정 실패');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('정말 삭제할까요?')) return;
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message ?? '삭제 실패');
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? '삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">직원 관리 (관리자)</h1>
        <p className="mt-2 text-white/60 text-sm">
          사전 등록된 이메일만 회원가입이 가능합니다. (pending/active만 허용)
        </p>

        <div className="mt-4 text-sm text-white/60">
          Pending: {stats.pending} / Active: {stats.active} / Disabled: {stats.disabled}
        </div>

        {msg && (
          <div className="mt-4 rounded-xl bg-black/40 px-4 py-3 text-sm text-white/80 ring-1 ring-white/10">
            {msg}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="font-semibold">직원 사전 등록</div>
          <div className="mt-3 grid gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full rounded-xl bg-black/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/25"
            />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="이름"
              className="w-full rounded-xl bg-black/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/25"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="휴대폰(선택)"
              className="w-full rounded-xl bg-black/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/25"
            />
            <button
              onClick={add}
              className="rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400 active:bg-emerald-600"
            >
              등록(pending)
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="font-semibold">직원 목록</div>
            <button
              onClick={load}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              disabled={loading}
            >
              {loading ? '불러오는 중...' : '새로고침'}
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {items.map((x) => (
              <div key={x.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{x.full_name}</div>
                    <div className="text-sm text-white/60">{x.email}</div>
                    <div className="text-xs text-white/40 mt-1">
                      status: {x.status} / profile_id: {x.profile_id ?? '-'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(x.id, 'pending')}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
                      >
                        pending
                      </button>
                      <button
                        onClick={() => setStatus(x.id, 'active')}
                        className="rounded-xl bg-emerald-500/80 px-3 py-2 text-xs text-black hover:bg-emerald-500"
                      >
                        active
                      </button>
                      <button
                        onClick={() => setStatus(x.id, 'disabled')}
                        className="rounded-xl bg-red-500/80 px-3 py-2 text-xs text-black hover:bg-red-500"
                      >
                        disabled
                      </button>
                    </div>
                    <button
                      onClick={() => remove(x.id)}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && items.length === 0 && (
              <div className="text-white/60 text-sm">등록된 직원이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
