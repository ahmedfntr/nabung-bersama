import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  Check,
  CreditCard,
  Edit3,
  History,
  LogOut,
  PieChart,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const HOUSEHOLD_ID = "a548fbaa-26c0-436a-bd3f-a7664639eccd";
const DEFAULT_CATEGORIES = [
  "Makan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Lainnya",
];
const TABLES = [
  "income",
  "expenses",
  "debts",
  "goals",
  "debt_payments",
  "budgets",
  "reminders",
  "expense_categories",
];

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const today = () => new Date().toISOString().slice(0, 10);

const dateText = (date) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const percent = (value, total) =>
  total ? Math.min(100, Math.max(0, (Number(value) / Number(total)) * 100)) : 0;

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Form({ children, onSubmit }) {
  return <form onSubmit={onSubmit}>{children}</form>;
}

function Actions({ cancel, loading, text = "Simpan" }) {
  return (
    <div className="form-actions">
      <button type="button" className="btn ghost" onClick={cancel} disabled={loading}>
        Batal
      </button>
      <button type="submit" className="btn primary" disabled={loading}>
        {loading ? "Menyimpan..." : text}
      </button>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) setError(loginError.message);
    setBusy(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-mark">
          <PiggyBank size={34} />
        </div>
        <h1>Nabung Bersama</h1>
        <p>Financial planner Ahmed & Nia</p>
        <Form onSubmit={submit}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error && <div className="alert">{error}</div>}
          <button className="btn primary wide" disabled={busy}>
            {busy ? "Masuk..." : "Masuk"}
          </button>
        </Form>
      </div>
    </div>
  );
}

function IncomeForm({ initial, onDone, cancel }) {
  const [form, setForm] = useState({
    owner: initial?.owner || "Ahmed",
    amount: initial?.amount ?? "",
    description: initial?.description || "",
    transaction_date: initial?.transaction_date || today(),
  });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    await onDone({ ...form, amount: Number(form.amount) });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <Field label="Pemilik">
        <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
          <option>Ahmed</option>
          <option>Nia</option>
          <option>Lainnya</option>
        </select>
      </Field>
      <Field label="Nominal">
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
      </Field>
      <Field label="Keterangan">
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Contoh: Gaji September"
        />
      </Field>
      <Field label="Tanggal">
        <input
          type="date"
          value={form.transaction_date}
          onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
          required
        />
      </Field>
      <Actions cancel={cancel} loading={busy} text={initial ? "Update" : "Simpan"} />
    </Form>
  );
}

function ExpenseForm({ initial, categories, onDone, cancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    category: initial?.category || categories[0] || "Lainnya",
    amount: initial?.amount ?? "",
    transaction_date: initial?.transaction_date || today(),
  });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    await onDone({ ...form, amount: Number(form.amount) });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <Field label="Nama Pengeluaran">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Kategori">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>
      <Field label="Nominal">
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
      </Field>
      <Field label="Tanggal">
        <input
          type="date"
          value={form.transaction_date}
          onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
          required
        />
      </Field>
      <Actions cancel={cancel} loading={busy} text={initial ? "Update" : "Simpan"} />
    </Form>
  );
}

function DebtForm({ initial, onDone, cancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    amount: initial?.amount ?? "",
    remaining: initial?.remaining ?? "",
    transaction_date: initial?.transaction_date || today(),
  });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    const total = Number(form.amount);
    const remaining = form.remaining === "" ? total : Number(form.remaining);
    if (total <= 0 || remaining < 0 || remaining > total) {
      alert("Total dan sisa utang tidak valid.");
      return;
    }
    setBusy(true);
    await onDone({ ...form, amount: total, remaining });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <Field label="Nama Cicilan / Utang">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Total Utang">
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
      </Field>
      <Field label="Sisa Utang">
        <input
          type="number"
          min="0"
          value={form.remaining}
          onChange={(e) => setForm({ ...form, remaining: e.target.value })}
        />
      </Field>
      <Field label="Tanggal">
        <input
          type="date"
          value={form.transaction_date}
          onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
          required
        />
      </Field>
      <Actions cancel={cancel} loading={busy} text={initial ? "Update" : "Simpan"} />
    </Form>
  );
}

function PaymentForm({ debt, onDone, cancel }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    const value = Number(amount);
    if (value <= 0 || value > Number(debt.remaining)) {
      alert("Nominal pembayaran tidak valid.");
      return;
    }
    setBusy(true);
    await onDone({ amount: value, payment_date: date, note: note.trim() || null });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <div className="mini-note">
        Sisa saat ini: <b>{money(debt.remaining)}</b>
      </div>
      <Field label="Nominal Pembayaran">
        <input
          type="number"
          min="1"
          max={debt.remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </Field>
      <Field label="Tanggal">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <Field label="Catatan">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
      </Field>
      <Actions cancel={cancel} loading={busy} />
    </Form>
  );
}

function GoalForm({ initial, onDone, cancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    target: initial?.target ?? "",
    saved: initial?.saved ?? "",
    monthly: initial?.monthly ?? "",
    target_date: initial?.target_date || "",
  });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (Number(form.target) <= 0 || Number(form.saved) < 0) {
      alert("Nominal target tidak valid.");
      return;
    }
    setBusy(true);
    await onDone({
      ...form,
      target: Number(form.target),
      saved: Number(form.saved || 0),
      monthly: Number(form.monthly || 0),
      target_date: form.target_date || null,
    });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <Field label="Nama Target">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Target">
        <input
          type="number"
          min="1"
          value={form.target}
          onChange={(e) => setForm({ ...form, target: e.target.value })}
          required
        />
      </Field>
      <Field label="Sudah Terkumpul">
        <input
          type="number"
          min="0"
          value={form.saved}
          onChange={(e) => setForm({ ...form, saved: e.target.value })}
        />
      </Field>
      <Field label="Target / Bulan">
        <input
          type="number"
          min="0"
          value={form.monthly}
          onChange={(e) => setForm({ ...form, monthly: e.target.value })}
        />
      </Field>
      <Field label="Tanggal Target">
        <input
          type="date"
          value={form.target_date}
          onChange={(e) => setForm({ ...form, target_date: e.target.value })}
        />
      </Field>
      <Actions cancel={cancel} loading={busy} text={initial ? "Update" : "Simpan"} />
    </Form>
  );
}

function BudgetForm({ initial, categories, onDone, cancel }) {
  const now = new Date();
  const [form, setForm] = useState({
    category: initial?.category || categories[0] || "Lainnya",
    amount: initial?.amount ?? "",
    year: initial?.year || now.getFullYear(),
    month: initial?.month || now.getMonth() + 1,
  });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (Number(form.amount) <= 0) {
      alert("Budget harus lebih dari 0.");
      return;
    }
    setBusy(true);
    await onDone({
      ...form,
      amount: Number(form.amount),
      year: Number(form.year),
      month: Number(form.month),
    });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <Field label="Kategori">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>
      <Field label="Budget">
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
      </Field>
      <div className="form-row">
        <Field label="Tahun">
          <input
            type="number"
            min="2020"
            max="2100"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            required
          />
        </Field>
        <Field label="Bulan">
          <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Actions cancel={cancel} loading={busy} text={initial ? "Update" : "Simpan"} />
    </Form>
  );
}

function ReminderForm({ onDone, cancel }) {
  const [form, setForm] = useState({ title: "", reminder_date: today(), note: "" });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    await onDone({ ...form, title: form.title.trim(), note: form.note.trim() || null });
    setBusy(false);
  }

  return (
    <Form onSubmit={save}>
      <Field label="Judul Reminder">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </Field>
      <Field label="Tanggal">
        <input
          type="date"
          value={form.reminder_date}
          onChange={(e) => setForm({ ...form, reminder_date: e.target.value })}
          required
        />
      </Field>
      <Field label="Catatan">
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </Field>
      <Actions cancel={cancel} loading={busy} />
    </Form>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState({
    income: [],
    expenses: [],
    debts: [],
    goals: [],
    payments: [],
    budgets: [],
    reminders: [],
    categories: [],
  });
  const [tab, setTab] = useState("dashboard");
  const [period, setPeriod] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const householdId = household?.id || HOUSEHOLD_ID;

  const closeModal = useCallback(() => {
    setModal(null);
    setEditing(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: authData }) => {
      if (!mounted) return;
      setSession(authData.session);
      setUser(authData.session?.user || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setHousehold(null);
      return;
    }

    let cancelled = false;

    async function loadHousehold() {
      const { data: member, error } = await supabase
        .from("household_members")
        .select("household_id, households(id,name)")
        .eq("user_id", user.id)
        .eq("household_id", HOUSEHOLD_ID)
        .single();

      if (cancelled) return;
      if (error) {
        console.error("Household error:", error);
        setHousehold(null);
        return;
      }
      setHousehold(member?.households || null);
    }

    loadHousehold();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const loadAll = useCallback(async () => {
    if (!user || !householdId) return;

    setSyncing(true);
    try {
      const [income, expenses, debts, goals, payments, budgets, reminders, categories] =
        await Promise.all([
          supabase.from("income").select("*").eq("household_id", householdId).order("transaction_date", { ascending: false }),
          supabase.from("expenses").select("*").eq("household_id", householdId).order("transaction_date", { ascending: false }),
          supabase.from("debts").select("*").eq("household_id", householdId).order("transaction_date", { ascending: false }),
          supabase.from("goals").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
          supabase.from("debt_payments").select("*").eq("household_id", householdId).order("payment_date", { ascending: false }),
          supabase.from("budgets").select("*").eq("household_id", householdId).order("year", { ascending: false }).order("month", { ascending: false }),
          supabase.from("reminders").select("*").eq("household_id", householdId).order("reminder_date", { ascending: true }),
          supabase.from("expense_categories").select("*").eq("household_id", householdId).order("name", { ascending: true }),
        ]);

      const results = { income, expenses, debts, goals, payments, budgets, reminders, categories };
      const failed = Object.entries(results).find(([, result]) => result.error);

      if (failed) {
        console.error(`${failed[0]} load error:`, failed[1].error);
        return;
      }

      setData({
        income: income.data || [],
        expenses: expenses.data || [],
        debts: debts.data || [],
        goals: goals.data || [],
        payments: payments.data || [],
        budgets: budgets.data || [],
        reminders: reminders.data || [],
        categories: (categories.data || []).map((item) => item.name),
      });
    } finally {
      setSyncing(false);
    }
  }, [user, householdId]);

  useEffect(() => {
    if (!user || !household) return;
    loadAll();
  }, [user, household, loadAll]);

  useEffect(() => {
    if (!user || !household) return;

    const channel = supabase.channel(`nabung-bersama-${householdId}`);

    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Reload the complete household snapshot. This also handles DELETE events
          // reliably because DELETE payloads do not always contain every old column.
          loadAll();
        }
      );
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") console.info("Realtime connected");
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, household, householdId, loadAll]);

  const categories = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...data.categories])),
    [data.categories]
  );

  const matchesPeriod = useCallback(
    (item) => {
      if (period === "all") return true;
      const rawDate =
        item.transaction_date ||
        item.payment_date ||
        item.target_date ||
        item.created_at?.slice(0, 10);
      if (!rawDate) return false;
      const date = new Date(`${rawDate}T00:00:00`);
      if (Number.isNaN(date.getTime())) return false;
      if (period === "year") return date.getFullYear() === Number(year);
      return date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month);
    },
    [period, year, month]
  );

  const income = useMemo(() => data.income.filter(matchesPeriod), [data.income, matchesPeriod]);
  const expenses = useMemo(() => data.expenses.filter(matchesPeriod), [data.expenses, matchesPeriod]);

  const totalIncome = useMemo(() => income.reduce((sum, item) => sum + Number(item.amount || 0), 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses]);
  const totalSaved = useMemo(() => data.goals.reduce((sum, item) => sum + Number(item.saved || 0), 0), [data.goals]);
  const totalDebt = useMemo(() => data.debts.reduce((sum, item) => sum + Number(item.remaining || 0), 0), [data.debts]);
  const remaining = totalIncome - totalExpenses;

  const selectedBudget = useMemo(
    () => data.budgets.filter((item) => Number(item.year) === Number(year) && Number(item.month) === Number(month)),
    [data.budgets, year, month]
  );

  const periodExpenses = useMemo(
    () =>
      data.expenses.filter((item) => {
        if (!item.transaction_date) return false;
        const date = new Date(`${item.transaction_date}T00:00:00`);
        return date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month);
      }),
    [data.expenses, year, month]
  );

  async function saveRow(table, payload, id) {
    const query = id
      ? supabase
          .from(table)
          .update(payload)
          .eq("id", id)
          .eq("household_id", householdId)
      : supabase.from(table).insert({ ...payload, household_id: householdId });

    const { data: saved, error } = await query.select().maybeSingle();
    if (error) {
      alert(error.message);
      return null;
    }
    return saved;
  }

  async function removeRow(table, id) {
    if (!window.confirm("Hapus data ini?")) return;

    // Optimistic UI: delete langsung dari layar.
    const keyMap = {
      income: "income",
      expenses: "expenses",
      debts: "debts",
      goals: "goals",
      debt_payments: "payments",
      budgets: "budgets",
      reminders: "reminders",
    };
    const key = keyMap[table];
    if (key) {
      setData((current) => ({
        ...current,
        [key]: current[key].filter((item) => item.id !== id),
      }));
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      alert(error.message);
      await loadAll();
      return;
    }

    await loadAll();
  }

  async function saveIncome(payload) {
    const saved = await saveRow("income", payload, editing?.id);
    if (!saved) return;
    closeModal();
    await loadAll();
  }

  async function saveExpense(payload) {
    const saved = await saveRow("expenses", payload, editing?.id);
    if (!saved) return;
    closeModal();
    await loadAll();
  }

  async function saveDebt(payload) {
    const saved = await saveRow("debts", payload, editing?.id);
    if (!saved) return;
    closeModal();
    await loadAll();
  }

  async function saveGoal(payload) {
    const saved = await saveRow("goals", payload, editing?.id);
    if (!saved) return;
    closeModal();
    await loadAll();
  }

  async function saveBudget(payload) {
    const saved = await saveRow("budgets", payload, editing?.id);
    if (!saved) return;
    closeModal();
    await loadAll();
  }

  async function saveReminder(payload) {
    const saved = await saveRow("reminders", payload, null);
    if (!saved) return;
    closeModal();
    await loadAll();
  }

  async function payDebt(payment) {
    if (!editing) return;

    const debtId = editing.id;
    const currentRemaining = Number(editing.remaining || 0);
    const paymentAmount = Number(payment.amount || 0);

    if (paymentAmount <= 0 || paymentAmount > currentRemaining) {
      alert("Nominal pembayaran tidak valid.");
      return;
    }

    const { error: paymentError } = await supabase.from("debt_payments").insert({
      ...payment,
      household_id: householdId,
      debt_id: debtId,
    });

    if (paymentError) {
      alert(paymentError.message);
      return;
    }

    const { error: debtError } = await supabase
      .from("debts")
      .update({ remaining: Math.max(0, currentRemaining - paymentAmount) })
      .eq("id", debtId)
      .eq("household_id", householdId);

    if (debtError) {
      alert(`Pembayaran tersimpan, tetapi sisa utang gagal diperbarui: ${debtError.message}`);
    }

    closeModal();
    await loadAll();
  }

  async function addCategory() {
    const name = window.prompt("Nama kategori baru:")?.trim();
    if (!name) return;

    const { error } = await supabase.from("expense_categories").insert({
      name,
      household_id: householdId,
    });

    if (error) alert(error.message);
    else await loadAll();
  }

  async function toggleReminder(reminder) {
    // Optimistic UI.
    setData((current) => ({
      ...current,
      reminders: current.reminders.map((item) =>
        item.id === reminder.id ? { ...item, done: !item.done } : item
      ),
    }));

    const { error } = await supabase
      .from("reminders")
      .update({ done: !reminder.done })
      .eq("id", reminder.id)
      .eq("household_id", householdId);

    if (error) {
      alert(error.message);
      await loadAll();
    }
  }

  async function notify() {
    if (!("Notification" in window)) {
      alert("Browser ini tidak mendukung notifikasi.");
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("Nabung Bersama", {
        body: "Notifikasi reminder keuangan sudah aktif.",
        icon: "/nabung-bersama/icon.svg",
      });
    }
  }

  if (loading) return <div className="loading">Memuat...</div>;
  if (!session) return <Login />;

  const nav = [
    ["dashboard", "Dashboard", <PieChart size={18} />],
    ["transactions", "Transaksi", <History size={18} />],
    ["debts", "Cicilan", <CreditCard size={18} />],
    ["goals", "Target", <Target size={18} />],
    ["budget", "Budget", <Wallet size={18} />],
    ["reminders", "Reminder", <Bell size={18} />],
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark small">
            <PiggyBank size={22} />
          </div>
          <div>
            <b>Nabung Bersama</b>
            <span>{household?.name || "Nabung Bersama - Ahmed & Nia"}</span>
          </div>
        </div>

        <div className="top-actions">
          <button className="btn ghost" onClick={notify}>
            <Bell size={16} /> Notifikasi
          </button>
          <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          {nav.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <main className="main">
          <div className="page-head">
            <div>
              <span className="eyebrow">FINANCIAL PLANNER</span>
              <h1>{nav.find((item) => item[0] === tab)?.[1]}</h1>
              <p>Kelola keuangan Ahmed & Nia secara realtime.</p>
            </div>

            <div className="filters">
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="all">Semua</option>
                <option value="year">Tahun</option>
                <option value="month">Bulan</option>
              </select>

              {period !== "all" && (
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  aria-label="Tahun"
                />
              )}

              {period === "month" && (
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Bulan">
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
              )}

              <button className="icon-btn" onClick={loadAll} title="Refresh data" disabled={syncing}>
                <span className={syncing ? "spin" : ""}>↻</span>
              </button>
            </div>
          </div>

          {tab === "dashboard" && (
            <Dashboard
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              totalSaved={totalSaved}
              remaining={remaining}
              totalDebt={totalDebt}
              goals={data.goals}
              expenses={expenses}
              budgets={selectedBudget}
            />
          )}

          {tab === "transactions" && (
            <Transactions
              income={income}
              expenses={expenses}
              categories={categories}
              addCategory={addCategory}
              onAddIncome={() => {
                setEditing(null);
                setModal("income");
              }}
              onAddExpense={() => {
                setEditing(null);
                setModal("expense");
              }}
              onEdit={(type, item) => {
                setEditing(item);
                setModal(type);
              }}
              onDelete={(table, id) => removeRow(table, id)}
            />
          )}

          {tab === "debts" && (
            <Debts
              debts={data.debts}
              payments={data.payments}
              onAdd={() => {
                setEditing(null);
                setModal("debt");
              }}
              onEdit={(item) => {
                setEditing(item);
                setModal("debt");
              }}
              onPay={(item) => {
                setEditing(item);
                setModal("payment");
              }}
              onDelete={(id) => removeRow("debts", id)}
            />
          )}

          {tab === "goals" && (
            <Goals
              goals={data.goals}
              onAdd={() => {
                setEditing(null);
                setModal("goal");
              }}
              onEdit={(item) => {
                setEditing(item);
                setModal("goal");
              }}
              onDelete={(id) => removeRow("goals", id)}
            />
          )}

          {tab === "budget" && (
            <Budget
              budgets={selectedBudget}
              expenses={periodExpenses}
              onAdd={() => {
                setEditing(null);
                setModal("budget");
              }}
              onEdit={(item) => {
                setEditing(item);
                setModal("budget");
              }}
              onDelete={(id) => removeRow("budgets", id)}
            />
          )}

          {tab === "reminders" && (
            <Reminders
              reminders={data.reminders}
              onAdd={() => {
                setEditing(null);
                setModal("reminder");
              }}
              onToggle={toggleReminder}
              onDelete={(id) => removeRow("reminders", id)}
            />
          )}
        </main>
      </div>

      {modal === "income" && (
        <Modal title={editing ? "Edit Pemasukan" : "Tambah Pemasukan"} onClose={closeModal}>
          <IncomeForm initial={editing} onDone={saveIncome} cancel={closeModal} />
        </Modal>
      )}

      {modal === "expense" && (
        <Modal title={editing ? "Edit Pengeluaran" : "Tambah Pengeluaran"} onClose={closeModal}>
          <ExpenseForm initial={editing} categories={categories} onDone={saveExpense} cancel={closeModal} />
        </Modal>
      )}

      {modal === "debt" && (
        <Modal title={editing ? "Edit Cicilan" : "Tambah Cicilan"} onClose={closeModal}>
          <DebtForm initial={editing} onDone={saveDebt} cancel={closeModal} />
        </Modal>
      )}

      {modal === "payment" && (
        <Modal title="Bayar Cicilan" onClose={closeModal}>
          <PaymentForm debt={editing} onDone={payDebt} cancel={closeModal} />
        </Modal>
      )}

      {modal === "goal" && (
        <Modal title={editing ? "Edit Target" : "Tambah Target"} onClose={closeModal}>
          <GoalForm initial={editing} onDone={saveGoal} cancel={closeModal} />
        </Modal>
      )}

      {modal === "budget" && (
        <Modal title={editing ? "Edit Budget" : "Tambah Budget"} onClose={closeModal}>
          <BudgetForm initial={editing} categories={categories} onDone={saveBudget} cancel={closeModal} />
        </Modal>
      )}

      {modal === "reminder" && (
        <Modal title="Tambah Reminder" onClose={closeModal}>
          <ReminderForm onDone={saveReminder} cancel={closeModal} />
        </Modal>
      )}
    </div>
  );
}

function Dashboard({ totalIncome, totalExpenses, totalSaved, remaining, totalDebt, goals, expenses, budgets }) {
  const byCategory = expenses.reduce((result, item) => {
    const category = item.category || "Lainnya";
    result[category] = (result[category] || 0) + Number(item.amount || 0);
    return result;
  }, {});

  return (
    <div className="stack">
      <div className="stats">
        <Stat title="Pemasukan" value={totalIncome} kind="income" icon={<ArrowUpCircle />} />
        <Stat title="Pengeluaran" value={totalExpenses} kind="expense" icon={<ArrowDownCircle />} />
        <Stat title="Tabungan" value={totalSaved} kind="saving" icon={<PiggyBank />} />
        <Stat title="Sisa Dana" value={remaining} kind="remaining" icon={<Wallet />} />
        <Stat title="Sisa Utang" value={totalDebt} kind="debt" icon={<CreditCard />} />
      </div>

      <div className="grid2">
        <Card title="Pengeluaran per Kategori">
          <Bars data={byCategory} />
        </Card>

        <Card title="Progress Target">
          <div className="goal-list">
            {goals.length ? (
              goals.map((goal) => (
                <div key={goal.id} className="progress-item">
                  <div>
                    <b>{goal.name}</b>
                    <span>{money(goal.saved)} / {money(goal.target)}</span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${percent(goal.saved, goal.target)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </div>
        </Card>
      </div>

      <Card title="Budget Bulan Ini">
        <div className="goal-list">
          {budgets.length ? (
            budgets.map((budget) => {
              const spent = expenses
                .filter((item) => (item.category || "Lainnya") === budget.category)
                .reduce((sum, item) => sum + Number(item.amount || 0), 0);
              return (
                <div className="progress-item" key={budget.id}>
                  <div>
                    <b>{budget.category}</b>
                    <span>{money(spent)} / {money(budget.amount)}</span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${percent(spent, budget.amount)}%` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <Empty text="Belum ada budget." />
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ title, value, icon, kind }) {
  return (
    <div className={`stat ${kind}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <small>{title}</small>
        <strong>{money(value)}</strong>
      </div>
    </div>
  );
}

function Bars({ data }) {
  const values = Object.values(data);
  const max = Math.max(1, ...values);
  if (!values.length) return <Empty text="Belum ada transaksi." />;

  return (
    <div className="bars">
      {Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([category, value]) => (
          <div className="bar-row" key={category}>
            <span>{category}</span>
            <div>
              <i style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <b>{money(value)}</b>
          </div>
        ))}
    </div>
  );
}

function Card({ title, children, action }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text = "Belum ada data." }) {
  return <div className="empty">{text}</div>;
}

function Transactions({ income, expenses, addCategory, onAddIncome, onAddExpense, onEdit, onDelete }) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Pemasukan & Pengeluaran</b>
          <span>{income.length + expenses.length} transaksi</span>
        </div>
        <div className="toolbar-actions">
          <button className="btn ghost" onClick={addCategory}>+ Kategori</button>
          <button className="btn primary" onClick={onAddIncome}><Plus size={16} /> Pemasukan</button>
          <button className="btn primary" onClick={onAddExpense}><Plus size={16} /> Pengeluaran</button>
        </div>
      </div>

      <Card title="Pemasukan">
        <List
          items={income}
          type="income"
          onEdit={(item) => onEdit("income", item)}
          onDelete={(id) => onDelete("income", id)}
        />
      </Card>

      <Card title="Pengeluaran">
        <List
          items={expenses}
          type="expense"
          onEdit={(item) => onEdit("expense", item)}
          onDelete={(id) => onDelete("expenses", id)}
        />
      </Card>
    </div>
  );
}

function List({ items, type, onEdit, onDelete }) {
  if (!items.length) return <Empty />;

  return (
    <div className="list">
      {items.map((item) => (
        <div className="list-item" key={item.id}>
          <div className="list-icon">
            {type === "income" ? <ArrowUpCircle /> : <ArrowDownCircle />}
          </div>
          <div className="list-main">
            <b>{type === "income" ? item.owner : item.name}</b>
            <span>
              {type === "income" ? item.description || "Pemasukan" : item.category || "Lainnya"} · {dateText(item.transaction_date)}
            </span>
          </div>
          <strong className={type === "expense" ? "negative" : ""}>
            {type === "expense" ? "-" : ""}{money(item.amount)}
          </strong>
          <button className="icon-btn" onClick={() => onEdit(item)} title="Edit">
            <Edit3 size={16} />
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(item.id)} title="Hapus">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Debts({ debts, payments, onAdd, onEdit, onPay, onDelete }) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Cicilan / Utang</b>
          <span>Bayar akan otomatis mengurangi sisa utang.</span>
        </div>
        <button className="btn primary" onClick={onAdd}><Plus size={16} /> Tambah</button>
      </div>

      <Card title="Daftar Utang">
        {debts.length ? (
          <div className="debt-grid">
            {debts.map((debt) => (
              <div className="debt-card" key={debt.id}>
                <div className="debt-top">
                  <b>{debt.name}</b>
                  <span>{dateText(debt.transaction_date)}</span>
                </div>
                <div className="debt-number">{money(debt.remaining)}</div>
                <small>Sisa dari {money(debt.amount)}</small>
                <div className="progress">
                  <i style={{ width: `${percent(Number(debt.amount) - Number(debt.remaining), debt.amount)}%` }} />
                </div>
                <div className="row-actions">
                  <button className="btn primary" onClick={() => onPay(debt)} disabled={Number(debt.remaining) <= 0}>
                    {Number(debt.remaining) <= 0 ? "Lunas" : "Bayar"}
                  </button>
                  <button className="icon-btn" onClick={() => onEdit(debt)} title="Edit"><Edit3 size={16} /></button>
                  <button className="icon-btn danger" onClick={() => onDelete(debt.id)} title="Hapus"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      <Card title="Riwayat Pembayaran">
        {payments.length ? <ListPayments payments={payments} debts={debts} /> : <Empty />}
      </Card>
    </div>
  );
}

function ListPayments({ payments, debts }) {
  return (
    <div className="list">
      {payments.map((payment) => (
        <div className="list-item" key={payment.id}>
          <div className="list-icon"><Check /></div>
          <div className="list-main">
            <b>{debts.find((debt) => debt.id === payment.debt_id)?.name || "Utang"}</b>
            <span>{dateText(payment.payment_date)} · {payment.note || "Pembayaran"}</span>
          </div>
          <strong>{money(payment.amount)}</strong>
        </div>
      ))}
    </div>
  );
}

function Goals({ goals, onAdd, onEdit, onDelete }) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Target Tabungan</b>
          <span>Progress tersimpan realtime.</span>
        </div>
        <button className="btn primary" onClick={onAdd}><Plus size={16} /> Tambah</button>
      </div>

      <div className="goal-grid">
        {goals.length ? goals.map((goal) => (
          <Card
            key={goal.id}
            title={goal.name}
            action={
              <div className="item-actions">
                <button className="icon-btn" onClick={() => onEdit(goal)} title="Edit"><Edit3 size={16} /></button>
                <button className="icon-btn danger" onClick={() => onDelete(goal.id)} title="Hapus"><Trash2 size={16} /></button>
              </div>
            }
          >
            <div className="big-percent">{Math.round(percent(goal.saved, goal.target))}%</div>
            <div className="progress big"><i style={{ width: `${percent(goal.saved, goal.target)}%` }} /></div>
            <div className="goal-meta">
              <span>{money(goal.saved)} terkumpul</span>
              <span>Target {money(goal.target)}</span>
            </div>
            <small>
              {goal.monthly ? `Rencana ${money(goal.monthly)}/bulan · ` : ""}
              {goal.target_date ? `Target ${dateText(goal.target_date)}` : "Tanggal belum diatur"}
            </small>
          </Card>
        )) : <Empty />}
      </div>
    </div>
  );
}

function Budget({ budgets, expenses, onAdd, onEdit, onDelete }) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Budget Bulanan</b>
          <span>Atur batas pengeluaran per kategori.</span>
        </div>
        <button className="btn primary" onClick={onAdd}><Plus size={16} /> Tambah</button>
      </div>

      <Card title="Budget">
        {budgets.length ? (
          <div className="budget-list">
            {budgets.map((budget) => {
              const spent = expenses
                .filter((item) => (item.category || "Lainnya") === budget.category)
                .reduce((sum, item) => sum + Number(item.amount || 0), 0);
              const over = spent > Number(budget.amount);

              return (
                <div className="budget-row" key={budget.id}>
                  <div>
                    <b>{budget.category}</b>
                    <span>{money(spent)} terpakai dari {money(budget.amount)}</span>
                  </div>
                  <div className="progress"><i style={{ width: `${percent(spent, budget.amount)}%` }} /></div>
                  <strong className={over ? "negative" : ""}>{Math.round(percent(spent, budget.amount))}%</strong>
                  <button className="icon-btn" onClick={() => onEdit(budget)} title="Edit"><Edit3 size={16} /></button>
                  <button className="icon-btn danger" onClick={() => onDelete(budget.id)} title="Hapus"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty text="Belum ada budget untuk periode ini." />
        )}
      </Card>
    </div>
  );
}

function Reminders({ reminders, onAdd, onToggle, onDelete }) {
  const due = reminders.filter((item) => !item.done && item.reminder_date <= today());

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Reminder</b>
          <span>{due.length ? `${due.length} reminder perlu diperhatikan.` : "Tidak ada reminder jatuh tempo."}</span>
        </div>
        <button className="btn primary" onClick={onAdd}><Plus size={16} /> Tambah</button>
      </div>

      <Card title="Daftar Reminder">
        {reminders.length ? (
          <div className="list">
            {reminders.map((reminder) => (
              <div className={`list-item ${reminder.done ? "done" : ""}`} key={reminder.id}>
                <button className="check-btn" onClick={() => onToggle(reminder)} title="Tandai selesai">
                  {reminder.done ? <Check size={16} /> : null}
                </button>
                <div className="list-main">
                  <b>{reminder.title}</b>
                  <span>{dateText(reminder.reminder_date)} · {reminder.note || "Tanpa catatan"}</span>
                </div>
                {!reminder.done && reminder.reminder_date <= today() && <span className="badge">Jatuh tempo</span>}
                <button className="icon-btn danger" onClick={() => onDelete(reminder.id)} title="Hapus">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Card>
    </div>
  );
}

export default App;
