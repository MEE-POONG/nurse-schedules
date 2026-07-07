import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import useAxios from "axios-hooks";
import {
  TbSearch,
  TbUserEdit,
  TbKey,
  TbUserOff,
  TbUserCheck,
  TbX,
  TbShieldCheck,
} from "react-icons/tb";
import LoadingComponent from "@/components/LoadingComponent";
import { authProvider } from "src/authProvider";

export default function ManageUsersPage() {
  const currentUser = authProvider.getIdentity();

  // ตรวจสอบสิทธิ์ผู้ดูแลระบบ
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      window.location.href = "/";
    }
  }, [currentUser]);

  const [{ data: users, loading }, refetch] = useAxios({
    url: "/api/user?all=1",
    method: "GET",
  });
  const [{ data: titles }] = useAxios({ url: "/api/title" });
  const [{ data: positions }] = useAxios({ url: "/api/position" });

  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState(null); // user object กำลังแก้ไข
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const kw = keyword.trim().toLowerCase();
    const list = kw
      ? users.filter((u) =>
          [u.firstname, u.lastname, u.username, u.Position?.name, u.Title?.name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(kw))
        )
      : users;
    // เรียงตาม SequenceNo แล้วตามด้วยชื่อ
    return [...list].sort(
      (a, b) =>
        (a.SequenceNo ?? 9999) - (b.SequenceNo ?? 9999) ||
        String(a.firstname || "").localeCompare(String(b.firstname || ""), "th")
    );
  }, [users, keyword]);

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">ไม่มีสิทธิ์เข้าถึง</h1>
          <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        </div>
      </div>
    );
  }

  // บันทึกการแก้ไข
  const handleSave = async (form) => {
    setSaving(true);
    try {
      await axios.put(`/api/user/${editing.id}`, form);
      setEditing(null);
      await refetch();
    } catch (e) {
      alert("บันทึกไม่สำเร็จ: " + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  // เปิด/ปิดการใช้งานผู้ใช้
  const toggleActive = async (u) => {
    const next = !u.isActive;
    if (
      !confirm(
        next
          ? `เปิดการใช้งานบัญชีของ ${u.firstname} ${u.lastname || ""}?`
          : `ปิดการใช้งานบัญชีของ ${u.firstname} ${u.lastname || ""}? (ประวัติเวรจะยังอยู่)`
      )
    )
      return;
    try {
      await axios.put(`/api/user/${u.id}`, { isActive: next });
      await refetch();
    } catch (e) {
      alert("ทำรายการไม่สำเร็จ: " + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div className="py-6 min-h-screen bg-gray-50 md:py-8">
      <div className="px-4 mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-gray-900 md:text-3xl">จัดการผู้ใช้</h1>
          <p className="text-sm text-gray-600 md:text-base">
            ดู/แก้ไขข้อมูลผู้ใช้ทุกคน และรีเซ็ตรหัสผ่านให้ผู้ที่เข้าระบบไม่ได้
          </p>
        </div>

        {/* ค้นหา */}
        <div className="relative mb-4 max-w-md">
          <TbSearch
            size={18}
            className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาชื่อ / นามสกุล / ชื่อผู้ใช้ / ตำแหน่ง"
            className="py-2.5 pr-3 pl-10 w-full text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <LoadingComponent />
        ) : (
          <>
            <div className="mb-3 text-xs text-gray-500">
              ทั้งหมด {filtered.length} คน
            </div>

            {/* ตาราง (จอคอม) */}
            <div className="hidden overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 font-medium">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-3 font-medium">ตำแหน่ง</th>
                    <th className="px-4 py-3 font-medium">ชื่อผู้ใช้</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center font-medium text-gray-900">
                          {u.Title?.name}
                          {u.firstname} {u.lastname}
                          {u.isAdmin && (
                            <TbShieldCheck
                              size={16}
                              className="text-teal-600"
                              title="ผู้ดูแลระบบ"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.Position?.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{u.username || "-"}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex px-2 py-0.5 text-xs text-green-700 bg-green-100 rounded-full">
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs text-gray-500 bg-gray-200 rounded-full">
                            ปิดใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setEditing(u)}
                            className="inline-flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100"
                          >
                            <TbUserEdit size={15} /> แก้ไข
                          </button>
                          <button
                            onClick={() => toggleActive(u)}
                            className={`inline-flex gap-1 items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                              u.isActive
                                ? "text-red-600 bg-red-50 hover:bg-red-100"
                                : "text-green-700 bg-green-50 hover:bg-green-100"
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <TbUserOff size={15} /> ปิด
                              </>
                            ) : (
                              <>
                                <TbUserCheck size={15} /> เปิด
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        ไม่พบผู้ใช้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* การ์ด (มือถือ) */}
            <div className="space-y-3 md:hidden">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex gap-1.5 items-center font-medium text-gray-900">
                        <span className="truncate">
                          {u.Title?.name}
                          {u.firstname} {u.lastname}
                        </span>
                        {u.isAdmin && (
                          <TbShieldCheck size={15} className="text-teal-600 shrink-0" />
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {u.Position?.name || "-"} · ผู้ใช้: {u.username || "-"}
                      </div>
                    </div>
                    {u.isActive ? (
                      <span className="inline-flex px-2 py-0.5 text-[11px] text-green-700 bg-green-100 rounded-full shrink-0">
                        ใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-[11px] text-gray-500 bg-gray-200 rounded-full shrink-0">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setEditing(u)}
                      className="inline-flex flex-1 gap-1 justify-center items-center px-3 py-2 text-xs font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100"
                    >
                      <TbUserEdit size={15} /> แก้ไข
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`inline-flex flex-1 gap-1 justify-center items-center px-3 py-2 text-xs font-medium rounded-md ${
                        u.isActive
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-green-700 bg-green-50 hover:bg-green-100"
                      }`}
                    >
                      {u.isActive ? (
                        <>
                          <TbUserOff size={15} /> ปิดใช้งาน
                        </>
                      ) : (
                        <>
                          <TbUserCheck size={15} /> เปิดใช้งาน
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-gray-400">ไม่พบผู้ใช้</div>
              )}
            </div>
          </>
        )}
      </div>

      <EditUserModal
        user={editing}
        titles={titles}
        positions={positions}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </div>
  );
}

// ── Modal แก้ไขข้อมูลผู้ใช้ ─────────────────────────────
function EditUserModal({ user, titles, positions, saving, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        username: user.username || "",
        password: "",
        titleId: user.titleId || "",
        positionId: user.positionId || "",
        isAdmin: !!user.isAdmin,
      });
    }
  }, [user]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.firstname?.trim()) {
      alert("กรุณากรอกชื่อ");
      return;
    }
    onSave(form);
  };

  return (
    <Transition show={!!user} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/45" />
        </Transition.Child>

        <div className="overflow-y-auto fixed inset-0">
          <div className="flex justify-center items-end p-0 min-h-full sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="transition-transform duration-200"
              enterFrom="translate-y-full sm:translate-y-4 sm:opacity-0"
              enterTo="translate-y-0 sm:opacity-100"
              leave="transition-transform duration-150"
              leaveFrom="translate-y-0 sm:opacity-100"
              leaveTo="translate-y-full sm:translate-y-4 sm:opacity-0"
            >
              <Dialog.Panel className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl sm:rounded-2xl">
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                  <Dialog.Title className="text-base font-semibold text-gray-900">
                    แก้ไขข้อมูลผู้ใช้
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="ปิด"
                  >
                    <TbX size={20} />
                  </button>
                </div>

                <form onSubmit={submit} className="px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="คำนำหน้า">
                      <select
                        value={form.titleId}
                        onChange={set("titleId")}
                        className="input-base"
                      >
                        {titles?.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="ตำแหน่ง">
                      <select
                        value={form.positionId}
                        onChange={set("positionId")}
                        className="input-base"
                      >
                        {positions?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="ชื่อ">
                      <input value={form.firstname} onChange={set("firstname")} className="input-base" />
                    </Field>
                    <Field label="นามสกุล">
                      <input value={form.lastname} onChange={set("lastname")} className="input-base" />
                    </Field>
                  </div>

                  <Field label="ชื่อผู้ใช้ (สำหรับเข้าระบบ)">
                    <input value={form.username} onChange={set("username")} className="input-base" />
                  </Field>

                  <Field label="รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)">
                    <div className="relative">
                      <TbKey
                        size={16}
                        className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2"
                      />
                      <input
                        value={form.password}
                        onChange={set("password")}
                        placeholder="รหัสผ่านใหม่"
                        autoComplete="new-password"
                        className="input-base !pl-9"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      ใช้สำหรับรีเซ็ตรหัสให้ผู้ที่ลืมรหัสผ่าน แจ้งรหัสใหม่ให้เจ้าตัวหลังบันทึก
                    </p>
                  </Field>

                  <label className="flex gap-2 items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isAdmin}
                      onChange={set("isAdmin")}
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                    />
                    เป็นผู้ดูแลระบบ (admin)
                  </label>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60"
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1 text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
