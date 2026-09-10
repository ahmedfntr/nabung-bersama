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
  Menu,
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

const DEFAULT_CATEGORIES = [
  "Makan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Lainnya",
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
  total
    ? Math.min(
        100,
        Math.max(0, (Number(value) / Number(total)) * 100)
      )
    : 0;

/* =========================================================
   COMMON
========================================================= */

function Modal({ title, close, children }) {
  return (
    <div className="modal-overlay" onMouseDown={close}>
      <div
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>

          <button
            className="icon-btn"
            onClick={close}
            type="button"
            aria-label="Tutup"
          >
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

function Form({ onSubmit, children }) {
  return <form onSubmit={onSubmit}>{children}</form>;
}

function Actions({ close, busy, text = "Simpan" }) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="btn ghost"
        onClick={close}
        disabled={busy}
      >
        Batal
      </button>

      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? "Menyimpan..." : text}
      </button>
    </div>
  );
}

function Empty({ text = "Belum ada data." }) {
  return <div className="empty">{text}</div>;
}

function Card({ title, action, children }) {
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

/* =========================================================
   LOGIN
========================================================= */

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError(loginError.message);
    }

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
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </Field>

          {error && <div className="alert">{error}</div>}

          <button
            className="btn primary wide"
            disabled={busy}
            type="submit"
          >
            {busy ? "Masuk..." : "Masuk"}
          </button>
        </Form>
      </div>
    </div>
  );
}

/* =========================================================
   INCOME FORM
========================================================= */

function IncomeForm({ initial, onDone, close }) {
  const [form, setForm] = useState({
    owner: initial?.owner || "Ahmed",
    amount: initial?.amount ?? "",
    description: initial?.description || "",
    transaction_date:
      initial?.transaction_date || today(),
  });

  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (Number(form.amount) <= 0) {
      alert("Nominal harus lebih dari 0.");
      return;
    }

    setBusy(true);

    await onDone({
      ...form,
      amount: Number(form.amount),
    });

    setBusy(false);
  }

  return (
    <Form onSubmit={submit}>
      <Field label="Pemilik">
        <select
          value={form.owner}
          onChange={(event) =>
            setForm({
              ...form,
              owner: event.target.value,
            })
          }
        >
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
          onChange={(event) =>
            setForm({
              ...form,
              amount: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Keterangan">
        <input
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description: event.target.value,
            })
          }
          placeholder="Contoh: Gaji September"
        />
      </Field>

      <Field label="Tanggal">
        <input
          type="date"
          value={form.transaction_date}
          onChange={(event) =>
            setForm({
              ...form,
              transaction_date: event.target.value,
            })
          }
          required
        />
      </Field>

      <Actions
        close={close}
        busy={busy}
        text={initial ? "Update" : "Simpan"}
      />
    </Form>
  );
}

/* =========================================================
   EXPENSE FORM
========================================================= */

function ExpenseForm({
  initial,
  categories,
  onDone,
  close,
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    category:
      initial?.category ||
      categories[0] ||
      "Lainnya",
    amount: initial?.amount ?? "",
    transaction_date:
      initial?.transaction_date || today(),
  });

  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (Number(form.amount) <= 0) {
      alert("Nominal harus lebih dari 0.");
      return;
    }

    setBusy(true);

    await onDone({
      ...form,
      amount: Number(form.amount),
    });

    setBusy(false);
  }

  return (
    <Form onSubmit={submit}>
      <Field label="Nama Pengeluaran">
        <input
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Kategori">
        <select
          value={form.category}
          onChange={(event) =>
            setForm({
              ...form,
              category: event.target.value,
            })
          }
        >
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
          onChange={(event) =>
            setForm({
              ...form,
              amount: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Tanggal">
        <input
          type="date"
          value={form.transaction_date}
          onChange={(event) =>
            setForm({
              ...form,
              transaction_date: event.target.value,
            })
          }
          required
        />
      </Field>

      <Actions
        close={close}
        busy={busy}
        text={initial ? "Update" : "Simpan"}
      />
    </Form>
  );
}

/* =========================================================
   DEBT FORM
========================================================= */

function DebtForm({ initial, onDone, close }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    amount: initial?.amount ?? "",
    remaining: initial?.remaining ?? "",
    transaction_date:
      initial?.transaction_date || today(),
  });

  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    const total = Number(form.amount);
    const remaining =
      form.remaining === ""
        ? total
        : Number(form.remaining);

    if (
      total <= 0 ||
      remaining < 0 ||
      remaining > total
    ) {
      alert("Total dan sisa utang tidak valid.");
      return;
    }

    setBusy(true);

    await onDone({
      ...form,
      amount: total,
      remaining,
    });

    setBusy(false);
  }

  return (
    <Form onSubmit={submit}>
      <Field label="Nama Cicilan / Utang">
        <input
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Total Utang">
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(event) =>
            setForm({
              ...form,
              amount: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Sisa Utang">
        <input
          type="number"
          min="0"
          value={form.remaining}
          onChange={(event) =>
            setForm({
              ...form,
              remaining: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Tanggal">
        <input
          type="date"
          value={form.transaction_date}
          onChange={(event) =>
            setForm({
              ...form,
              transaction_date: event.target.value,
            })
          }
          required
        />
      </Field>

      <Actions
        close={close}
        busy={busy}
        text={initial ? "Update" : "Simpan"}
      />
    </Form>
  );
}

/* =========================================================
   PAYMENT FORM
========================================================= */

function PaymentForm({ debt, onDone, close }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    const value = Number(amount);

    if (
      value <= 0 ||
      value > Number(debt.remaining)
    ) {
      alert("Nominal pembayaran tidak valid.");
      return;
    }

    setBusy(true);

    await onDone({
      amount: value,
      payment_date: date,
      note: note.trim() || null,
    });

    setBusy(false);
  }

  return (
    <Form onSubmit={submit}>
      <div className="mini-note">
        Sisa saat ini:{" "}
        <b>{money(debt.remaining)}</b>
      </div>

      <Field label="Nominal Pembayaran">
        <input
          type="number"
          min="1"
          max={debt.remaining}
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          required
        />
      </Field>

      <Field label="Tanggal">
        <input
          type="date"
          value={date}
          onChange={(event) =>
            setDate(event.target.value)
          }
          required
        />
      </Field>

      <Field label="Catatan">
        <input
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
        />
      </Field>

      <Actions
        close={close}
        busy={busy}
        text="Bayar"
      />
    </Form>
  );
}

/* =========================================================
   GOAL FORM
========================================================= */

function GoalForm({ initial, onDone, close }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    target: initial?.target ?? "",
    saved: initial?.saved ?? 0,
    monthly: initial?.monthly ?? 0,
    target_date: initial?.target_date || "",
  });

  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (
      Number(form.target) <= 0 ||
      Number(form.saved) < 0
    ) {
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
    <Form onSubmit={submit}>
      <Field label="Nama Target">
        <input
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Target">
        <input
          type="number"
          min="1"
          value={form.target}
          onChange={(event) =>
            setForm({
              ...form,
              target: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Sudah Terkumpul">
        <input
          type="number"
          min="0"
          value={form.saved}
          onChange={(event) =>
            setForm({
              ...form,
              saved: event.target.value,
            })
          }
        />
      </Field>

      <Field label="Target / Bulan">
        <input
          type="number"
          min="0"
          value={form.monthly}
          onChange={(event) =>
            setForm({
              ...form,
              monthly: event.target.value,
            })
          }
        />
      </Field>

      <Field label="Tanggal Target">
        <input
          type="date"
          value={form.target_date}
          onChange={(event) =>
            setForm({
              ...form,
              target_date: event.target.value,
            })
          }
        />
      </Field>

      <Actions
        close={close}
        busy={busy}
        text={initial ? "Update" : "Simpan"}
      />
    </Form>
  );
}

/* =========================================================
   BUDGET FORM
========================================================= */

function BudgetForm({
  initial,
  categories,
  onDone,
  close,
}) {
  const now = new Date();

  const [form, setForm] = useState({
    category:
      initial?.category ||
      categories[0] ||
      "Lainnya",
    amount: initial?.amount ?? "",
    year:
      initial?.year ||
      now.getFullYear(),
    month:
      initial?.month ||
      now.getMonth() + 1,
  });

  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

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
    <Form onSubmit={submit}>
      <Field label="Kategori">
        <select
          value={form.category}
          onChange={(event) =>
            setForm({
              ...form,
              category: event.target.value,
            })
          }
        >
          {categories.map((category) => (
            <option key={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Budget">
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(event) =>
            setForm({
              ...form,
              amount: event.target.value,
            })
          }
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
            onChange={(event) =>
              setForm({
                ...form,
                year: event.target.value,
              })
            }
            required
          />
        </Field>

        <Field label="Bulan">
          <select
            value={form.month}
            onChange={(event) =>
              setForm({
                ...form,
                month: Number(event.target.value),
              })
            }
          >
            {Array.from(
              { length: 12 },
              (_, index) => (
                <option
                  key={index + 1}
                  value={index + 1}
                >
                  {index + 1}
                </option>
              )
            )}
          </select>
        </Field>
      </div>

      <Actions
        close={close}
        busy={busy}
        text={initial ? "Update" : "Simpan"}
      />
    </Form>
  );
}

/* =========================================================
   REMINDER FORM
========================================================= */

function ReminderForm({
  initial,
  onDone,
  close,
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    reminder_date:
      initial?.reminder_date || today(),
    note: initial?.note || "",
  });

  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Judul reminder wajib diisi.");
      return;
    }

    setBusy(true);

    await onDone({
      ...form,
      title: form.title.trim(),
      note: form.note.trim() || null,
    });

    setBusy(false);
  }

  return (
    <Form onSubmit={submit}>
      <Field label="Judul Reminder">
        <input
          value={form.title}
          onChange={(event) =>
            setForm({
              ...form,
              title: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Tanggal">
        <input
          type="date"
          value={form.reminder_date}
          onChange={(event) =>
            setForm({
              ...form,
              reminder_date: event.target.value,
            })
          }
          required
        />
      </Field>

      <Field label="Catatan">
        <input
          value={form.note}
          onChange={(event) =>
            setForm({
              ...form,
              note: event.target.value,
            })
          }
        />
      </Field>

      <Actions
        close={close}
        busy={busy}
        text={initial ? "Update" : "Simpan"}
      />
    </Form>
  );
}

/* =========================================================
   APP
========================================================= */

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
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [period, setPeriod] = useState("all");
  const [year, setYear] = useState(
    new Date().getFullYear()
  );
  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );

  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const householdId =
    household?.id || HOUSEHOLD_ID;

  const closeModal = useCallback(() => {
    setModal(null);
    setEditing(null);
  }, []);

  /* =====================================================
     AUTH
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: authData }) => {
        if (!mounted) return;

        setSession(authData.session);
        setUser(authData.session?.user || null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user || null);

        if (!nextSession) {
          setHousehold(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =====================================================
     HOUSEHOLD
  ===================================================== */

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadHousehold() {
      const { data: member, error } =
        await supabase
          .from("household_members")
          .select(
            "household_id, households(id,name)"
          )
          .eq("user_id", user.id)
          .eq("household_id", HOUSEHOLD_ID)
          .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(
          "Household error:",
          error
        );
        return;
      }

      setHousehold(member?.households || null);
    }

    loadHousehold();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* =====================================================
     LOAD ALL DATA
  ===================================================== */

  const loadAll = useCallback(async () => {
    if (!user || !householdId) return;

    setSyncing(true);

    try {
      const [
        income,
        expenses,
        debts,
        goals,
        payments,
        budgets,
        reminders,
        categories,
      ] = await Promise.all([
        supabase
          .from("income")
          .select("*")
          .eq("household_id", householdId)
          .order("transaction_date", {
            ascending: false,
          }),

        supabase
          .from("expenses")
          .select("*")
          .eq("household_id", householdId)
          .order("transaction_date", {
            ascending: false,
          }),

        supabase
          .from("debts")
          .select("*")
          .eq("household_id", householdId)
          .order("transaction_date", {
            ascending: false,
          }),

        supabase
          .from("goals")
          .select("*")
          .eq("household_id", householdId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("debt_payments")
          .select("*")
          .eq("household_id", householdId)
          .order("payment_date", {
            ascending: false,
          }),

        supabase
          .from("budgets")
          .select("*")
          .eq("household_id", householdId)
          .order("year", {
            ascending: false,
          })
          .order("month", {
            ascending: false,
          }),

        supabase
          .from("reminders")
          .select("*")
          .eq("household_id", householdId)
          .order("reminder_date", {
            ascending: true,
          }),

        supabase
          .from("expense_categories")
          .select("*")
          .eq("household_id", householdId)
          .order("name", {
            ascending: true,
          }),
      ]);

      const failed = [
        ["income", income],
        ["expenses", expenses],
        ["debts", debts],
        ["goals", goals],
        ["payments", payments],
        ["budgets", budgets],
        ["reminders", reminders],
        ["categories", categories],
      ].find(([, result]) => result.error);

      if (failed) {
        console.error(
          `${failed[0]} load error:`,
          failed[1].error
        );
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
        categories: (categories.data || []).map(
          (item) => item.name
        ),
      });
    } finally {
      setSyncing(false);
    }
  }, [user, householdId]);

  useEffect(() => {
    if (user && household) {
      loadAll();
    }
  }, [user, household, loadAll]);

  /* =====================================================
     REALTIME
  ===================================================== */

  useEffect(() => {
    if (!user || !household) return;

    const channel = supabase.channel(
      `nabung-bersama-${householdId}`
    );

    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => {
          loadAll();
        }
      );
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info(
          "Nabung Bersama realtime connected"
        );
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    user,
    household,
    householdId,
    loadAll,
  ]);

  /* =====================================================
     FILTER
  ===================================================== */

  const categories = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_CATEGORIES,
          ...data.categories,
        ])
      ),
    [data.categories]
  );

  const matchesPeriod = useCallback(
    (item) => {
      if (period === "all") return true;

      const rawDate =
        item.transaction_date ||
        item.payment_date ||
        item.target_date ||
        item.reminder_date ||
        item.created_at?.slice(0, 10);

      if (!rawDate) return false;

      const date = new Date(
        `${rawDate}T00:00:00`
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (period === "year") {
        return (
          date.getFullYear() === Number(year)
        );
      }

      return (
        date.getFullYear() === Number(year) &&
        date.getMonth() + 1 === Number(month)
      );
    },
    [period, year, month]
  );

  const income = useMemo(
    () => data.income.filter(matchesPeriod),
    [data.income, matchesPeriod]
  );

  const expenses = useMemo(
    () => data.expenses.filter(matchesPeriod),
    [data.expenses, matchesPeriod]
  );

  /* =====================================================
     DASHBOARD CALCULATION
  ===================================================== */

  const totalIncome = useMemo(
    () =>
      income.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),
    [income]
  );

  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const totalSaved = useMemo(
    () =>
      data.goals.reduce(
        (sum, item) =>
          sum + Number(item.saved || 0),
        0
      ),
    [data.goals]
  );

  const totalDebt = useMemo(
    () =>
      data.debts.reduce(
        (sum, item) =>
          sum + Number(item.remaining || 0),
        0
      ),
    [data.debts]
  );

  const remaining =
    totalIncome - totalExpenses;

  const selectedBudget = useMemo(
    () =>
      data.budgets.filter(
        (item) =>
          Number(item.year) === Number(year) &&
          Number(item.month) === Number(month)
      ),
    [data.budgets, year, month]
  );

  const periodExpenses = useMemo(
    () =>
      data.expenses.filter((item) => {
        if (!item.transaction_date) {
          return false;
        }

        const date = new Date(
          `${item.transaction_date}T00:00:00`
        );

        return (
          date.getFullYear() === Number(year) &&
          date.getMonth() + 1 === Number(month)
        );
      }),
    [data.expenses, year, month]
  );

  /* =====================================================
     CRUD
  ===================================================== */

  async function saveRow(
    table,
    payload,
    id = null
  ) {
    /* ================= UPDATE ================= */

    if (id) {
      const {
        data: updatedRows,
        error,
      } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .eq("household_id", householdId)
        .select();

      if (error) {
        console.error(
          `UPDATE ${table} error:`,
          error
        );

        alert(
          `Gagal mengubah data.\n\n${error.message}`
        );

        return false;
      }

      if (!updatedRows?.length) {
        console.error(
          `UPDATE ${table}: no row returned`,
          {
            id,
            householdId,
          }
        );

        alert(
          "Data tidak berubah.\n\nKemungkinan policy UPDATE/RLS Supabase belum aktif untuk tabel ini."
        );

        return false;
      }

      await loadAll();

      return true;
    }

    /* ================= CREATE ================= */

    const {
      data: insertedRows,
      error,
    } = await supabase
      .from(table)
      .insert({
        ...payload,
        household_id: householdId,
      })
      .select();

    if (error) {
      console.error(
        `INSERT ${table} error:`,
        error
      );

      alert(
        `Gagal menyimpan data.\n\n${error.message}`
      );

      return false;
    }

    if (!insertedRows?.length) {
      alert("Data tidak berhasil disimpan.");
      return false;
    }

    await loadAll();

    return true;
  }

  async function removeRow(table, id) {
    if (!window.confirm("Hapus data ini?")) {
      return;
    }

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
    const previousData = data;

    /* Optimistic UI */
    if (key) {
      setData((current) => ({
        ...current,
        [key]: current[key].filter(
          (item) => item.id !== id
        ),
      }));
    }

    const {
      data: deletedRows,
      error,
    } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("household_id", householdId)
      .select();

    if (error) {
      console.error(
        `DELETE ${table} error:`,
        error
      );

      setData(previousData);

      alert(
        `Gagal menghapus data.\n\n${error.message}`
      );

      return;
    }

    if (!deletedRows?.length) {
      console.error(
        `DELETE ${table}: no row returned`,
        {
          id,
          householdId,
        }
      );

      setData(previousData);

      alert(
        "Data tidak terhapus.\n\nKemungkinan policy DELETE/RLS Supabase belum aktif untuk tabel ini."
      );

      return;
    }

    await loadAll();
  }

  async function saveIncome(payload) {
    const success = await saveRow(
      "income",
      payload,
      editing?.id || null
    );

    if (success) {
      closeModal();
    }
  }

  async function saveExpense(payload) {
    const success = await saveRow(
      "expenses",
      payload,
      editing?.id || null
    );

    if (success) {
      closeModal();
    }
  }

  async function saveDebt(payload) {
    const success = await saveRow(
      "debts",
      payload,
      editing?.id || null
    );

    if (success) {
      closeModal();
    }
  }

  async function saveGoal(payload) {
    const success = await saveRow(
      "goals",
      payload,
      editing?.id || null
    );

    if (success) {
      closeModal();
    }
  }

  async function saveBudget(payload) {
    const success = await saveRow(
      "budgets",
      payload,
      editing?.id || null
    );

    if (success) {
      closeModal();
    }
  }

  async function saveReminder(payload) {
    const success = await saveRow(
      "reminders",
      payload,
      editing?.id || null
    );

    if (success) {
      closeModal();
    }
  }

  /* =====================================================
     DEBT PAYMENT
  ===================================================== */

  async function payDebt(payload) {
    if (!editing) return;

    const debtId = editing.id;
    const currentRemaining = Number(
      editing.remaining || 0
    );

    const paymentAmount = Number(
      payload.amount || 0
    );

    if (
      paymentAmount <= 0 ||
      paymentAmount > currentRemaining
    ) {
      alert("Nominal pembayaran tidak valid.");
      return;
    }

    const {
      error: paymentError,
    } = await supabase
      .from("debt_payments")
      .insert({
        ...payload,
        household_id: householdId,
        debt_id: debtId,
      })
      .select();

    if (paymentError) {
      alert(
        `Gagal menyimpan pembayaran.\n\n${paymentError.message}`
      );
      return;
    }

    const {
      data: updatedDebt,
      error: debtError,
    } = await supabase
      .from("debts")
      .update({
        remaining: Math.max(
          0,
          currentRemaining - paymentAmount
        ),
      })
      .eq("id", debtId)
      .eq("household_id", householdId)
      .select();

    if (debtError) {
      alert(
        `Pembayaran tersimpan, tetapi sisa utang gagal diperbarui.\n\n${debtError.message}`
      );

      await loadAll();
      return;
    }

    if (!updatedDebt?.length) {
      alert(
        "Pembayaran tersimpan, tetapi sisa utang tidak berubah. Cek policy UPDATE pada tabel debts."
      );

      await loadAll();
      return;
    }

    closeModal();

    await loadAll();
  }

  /* =====================================================
     REMINDER TOGGLE
  ===================================================== */

  async function toggleReminder(reminder) {
    const nextDone = !reminder.done;

    setData((current) => ({
      ...current,
      reminders: current.reminders.map(
        (item) =>
          item.id === reminder.id
            ? {
                ...item,
                done: nextDone,
              }
            : item
      ),
    }));

    const {
      error,
    } = await supabase
      .from("reminders")
      .update({
        done: nextDone,
      })
      .eq("id", reminder.id)
      .eq("household_id", householdId)
      .select();

    if (error) {
      alert(
        `Gagal memperbarui reminder.\n\n${error.message}`
      );

      await loadAll();
    }
  }

  /* =====================================================
     CATEGORY
  ===================================================== */

  async function addCategory() {
    const name = window
      .prompt("Nama kategori baru:")
      ?.trim();

    if (!name) return;

    const {
      error,
    } = await supabase
      .from("expense_categories")
      .insert({
        name,
        household_id: householdId,
      })
      .select();

    if (error) {
      alert(
        `Gagal menambah kategori.\n\n${error.message}`
      );

      return;
    }

    await loadAll();
  }

  /* =====================================================
     NOTIFICATION
  ===================================================== */

  async function notify() {
    if (!("Notification" in window)) {
      alert(
        "Browser ini tidak mendukung notifikasi."
      );
      return;
    }

    let permission =
      Notification.permission;

    if (permission === "default") {
      permission =
        await Notification.requestPermission();
    }

    if (permission === "granted") {
      new Notification("Nabung Bersama", {
        body:
          "Notifikasi reminder keuangan sudah aktif.",
        icon: "/icon.svg",
      });
    }
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const nav = [
    [
      "dashboard",
      "Dashboard",
      <PieChart size={18} />,
    ],
    [
      "transactions",
      "Transaksi",
      <History size={18} />,
    ],
    [
      "debts",
      "Cicilan",
      <CreditCard size={18} />,
    ],
    [
      "goals",
      "Target",
      <Target size={18} />,
    ],
    [
      "budget",
      "Budget",
      <Wallet size={18} />,
    ],
    [
      "reminders",
      "Reminder",
      <Bell size={18} />,
    ],
  ];

  function openModal(type, item = null) {
    setEditing(item);
    setModal(type);
    setMobileMenuOpen(false);
  }

  /* =====================================================
     RENDER
  ===================================================== */

  if (loading) {
    return (
      <div className="loading">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app">
      {/* ================= HEADER ================= */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark small">
            <PiggyBank size={22} />
          </div>

          <div>
            <b>Nabung Bersama</b>

            <span>
              {household?.name ||
                "Nabung Bersama - Ahmed & Nia"}
            </span>
          </div>
        </div>

        <div className="top-actions">
          <button
            className="btn ghost notification-button"
            onClick={notify}
          >
            <Bell size={16} />
            <span>Notifikasi</span>
          </button>

          <button
            className="btn ghost logout-button"
            onClick={() =>
              supabase.auth.signOut()
            }
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>

          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                (open) => !open
              )
            }
            aria-label={
              mobileMenuOpen
                ? "Tutup menu"
                : "Buka menu"
            }
            aria-expanded={
              mobileMenuOpen
            }
          >
            {mobileMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>
      </header>

      {/* ================= BODY ================= */}

      <div className="layout">
        {mobileMenuOpen && (
          <div
            className="mobile-menu-backdrop"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />
        )}

        <aside
          className={`sidebar ${
            mobileMenuOpen
              ? "mobile-open"
              : ""
          }`}
        >
          {nav.map(
            ([id, label, icon]) => (
              <button
                key={id}
                className={
                  tab === id
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setTab(id);
                  setMobileMenuOpen(false);
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            )
          )}
        </aside>

        <main className="main">
          {/* ================= PAGE HEADER ================= */}

          <div className="page-head">
            <div>
              <span className="eyebrow">
                FINANCIAL PLANNER
              </span>

              <h1>
                {
                  nav.find(
                    (item) =>
                      item[0] === tab
                  )?.[1]
                }
              </h1>

              <p>
                Kelola keuangan Ahmed & Nia
                secara realtime.
              </p>
            </div>

            <div className="filters">
              <select
                value={period}
                onChange={(event) =>
                  setPeriod(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  Semua
                </option>

                <option value="year">
                  Tahun
                </option>

                <option value="month">
                  Bulan
                </option>
              </select>

              {period !== "all" && (
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={year}
                  onChange={(event) =>
                    setYear(
                      event.target.value
                    )
                  }
                  aria-label="Tahun"
                />
              )}

              {period === "month" && (
                <select
                  value={month}
                  onChange={(event) =>
                    setMonth(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  aria-label="Bulan"
                >
                  {Array.from(
                    { length: 12 },
                    (_, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                      >
                        {index + 1}
                      </option>
                    )
                  )}
                </select>
              )}

              <button
                className="icon-btn"
                onClick={loadAll}
                disabled={syncing}
                title="Refresh"
              >
                ↻
              </button>
            </div>
          </div>

          {/* ================= DASHBOARD ================= */}

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

          {/* ================= TRANSACTIONS ================= */}

          {tab === "transactions" && (
            <Transactions
              income={income}
              expenses={expenses}
              addCategory={addCategory}
              addIncome={() =>
                openModal("income")
              }
              addExpense={() =>
                openModal("expense")
              }
              edit={(type, item) =>
                openModal(type, item)
              }
              del={removeRow}
            />
          )}

          {/* ================= DEBTS ================= */}

          {tab === "debts" && (
            <Debts
              debts={data.debts}
              payments={data.payments}
              add={() =>
                openModal("debt")
              }
              edit={(item) =>
                openModal("debt", item)
              }
              pay={(item) =>
                openModal("payment", item)
              }
              del={removeRow}
            />
          )}

          {/* ================= GOALS ================= */}

          {tab === "goals" && (
            <Goals
              goals={data.goals}
              add={() =>
                openModal("goal")
              }
              edit={(item) =>
                openModal("goal", item)
              }
              del={removeRow}
            />
          )}

          {/* ================= BUDGET ================= */}

          {tab === "budget" && (
            <Budget
              budgets={selectedBudget}
              expenses={periodExpenses}
              add={() =>
                openModal("budget")
              }
              edit={(item) =>
                openModal(
                  "budget",
                  item
                )
              }
              del={removeRow}
            />
          )}

          {/* ================= REMINDERS ================= */}

          {tab === "reminders" && (
            <Reminders
              reminders={data.reminders}
              add={() =>
                openModal("reminder")
              }
              edit={(item) =>
                openModal(
                  "reminder",
                  item
                )
              }
              toggle={toggleReminder}
              del={removeRow}
            />
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}

      {modal === "income" && (
        <Modal
          title={
            editing
              ? "Edit Pemasukan"
              : "Tambah Pemasukan"
          }
          close={closeModal}
        >
          <IncomeForm
            initial={editing}
            onDone={saveIncome}
            close={closeModal}
          />
        </Modal>
      )}

      {modal === "expense" && (
        <Modal
          title={
            editing
              ? "Edit Pengeluaran"
              : "Tambah Pengeluaran"
          }
          close={closeModal}
        >
          <ExpenseForm
            initial={editing}
            categories={categories}
            onDone={saveExpense}
            close={closeModal}
          />
        </Modal>
      )}

      {modal === "debt" && (
        <Modal
          title={
            editing
              ? "Edit Cicilan"
              : "Tambah Cicilan"
          }
          close={closeModal}
        >
          <DebtForm
            initial={editing}
            onDone={saveDebt}
            close={closeModal}
          />
        </Modal>
      )}

      {modal === "payment" && (
        <Modal
          title="Bayar Cicilan"
          close={closeModal}
        >
          <PaymentForm
            debt={editing}
            onDone={payDebt}
            close={closeModal}
          />
        </Modal>
      )}

      {modal === "goal" && (
        <Modal
          title={
            editing
              ? "Edit Target"
              : "Tambah Target"
          }
          close={closeModal}
        >
          <GoalForm
            initial={editing}
            onDone={saveGoal}
            close={closeModal}
          />
        </Modal>
      )}

      {modal === "budget" && (
        <Modal
          title={
            editing
              ? "Edit Budget"
              : "Tambah Budget"
          }
          close={closeModal}
        >
          <BudgetForm
            initial={editing}
            categories={categories}
            onDone={saveBudget}
            close={closeModal}
          />
        </Modal>
      )}

      {modal === "reminder" && (
        <Modal
          title={
            editing
              ? "Edit Reminder"
              : "Tambah Reminder"
          }
          close={closeModal}
        >
          <ReminderForm
            initial={editing}
            onDone={saveReminder}
            close={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  totalIncome,
  totalExpenses,
  totalSaved,
  remaining,
  totalDebt,
  goals,
  expenses,
  budgets,
}) {
  const byCategory = expenses.reduce(
    (result, item) => {
      const category =
        item.category || "Lainnya";

      result[category] =
        (result[category] || 0) +
        Number(item.amount || 0);

      return result;
    },
    {}
  );

  const max = Math.max(
    1,
    ...Object.values(byCategory)
  );

  return (
    <div className="stack">
      <div className="stats">
        <Stat
          title="Pemasukan"
          value={totalIncome}
          icon={<ArrowUpCircle />}
        />

        <Stat
          title="Pengeluaran"
          value={totalExpenses}
          kind="expense"
          icon={<ArrowDownCircle />}
        />

        <Stat
          title="Tabungan"
          value={totalSaved}
          icon={<PiggyBank />}
        />

        <Stat
          title="Sisa Dana"
          value={remaining}
          icon={<Wallet />}
        />

        <Stat
          title="Sisa Utang"
          value={totalDebt}
          kind="debt"
          icon={<CreditCard />}
        />
      </div>

      <div className="grid2">
        <Card title="Pengeluaran per Kategori">
          {Object.keys(byCategory).length ? (
            <div className="bars">
              {Object.entries(byCategory)
                .sort(
                  (a, b) => b[1] - a[1]
                )
                .map(
                  ([category, value]) => (
                    <div
                      className="bar-row"
                      key={category}
                    >
                      <span>
                        {category}
                      </span>

                      <div>
                        <i
                          style={{
                            width: `${
                              (value / max) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      <b>
                        {money(value)}
                      </b>
                    </div>
                  )
                )}
            </div>
          ) : (
            <Empty text="Belum ada transaksi." />
          )}
        </Card>

        <Card title="Progress Target">
          {goals.length ? (
            goals.map((goal) => (
              <div
                className="progress-item"
                key={goal.id}
              >
                <div>
                  <b>{goal.name}</b>

                  <span>
                    {money(goal.saved)} /{" "}
                    {money(goal.target)}
                  </span>
                </div>

                <div className="progress">
                  <i
                    style={{
                      width: `${percent(
                        goal.saved,
                        goal.target
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <Empty />
          )}
        </Card>
      </div>

      <Card title="Budget Bulan Ini">
        {budgets.length ? (
          budgets.map((budget) => {
            const spent = expenses
              .filter(
                (item) =>
                  (item.category ||
                    "Lainnya") ===
                  budget.category
              )
              .reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.amount || 0
                  ),
                0
              );

            return (
              <div
                className="progress-item"
                key={budget.id}
              >
                <div>
                  <b>
                    {budget.category}
                  </b>

                  <span>
                    {money(spent)} /{" "}
                    {money(
                      budget.amount
                    )}
                  </span>
                </div>

                <div className="progress">
                  <i
                    style={{
                      width: `${percent(
                        spent,
                        budget.amount
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <Empty text="Belum ada budget." />
        )}
      </Card>
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
  kind = "",
}) {
  return (
    <div className={`stat ${kind}`}>
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <small>{title}</small>
        <strong>{money(value)}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTIONS
========================================================= */

function Transactions({
  income,
  expenses,
  addCategory,
  addIncome,
  addExpense,
  edit,
  del,
}) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>
            Pemasukan & Pengeluaran
          </b>

          <span>
            {income.length +
              expenses.length}{" "}
            transaksi
          </span>
        </div>

        <div className="toolbar-actions">
          <button
            className="btn"
            onClick={addCategory}
          >
            + Kategori
          </button>

          <button
            className="btn primary"
            onClick={addIncome}
          >
            <Plus size={16} />
            Pemasukan
          </button>

          <button
            className="btn primary"
            onClick={addExpense}
          >
            <Plus size={16} />
            Pengeluaran
          </button>
        </div>
      </div>

      <Card title="Pemasukan">
        <List
          items={income}
          type="income"
          edit={(item) =>
            edit("income", item)
          }
          del={(id) =>
            del("income", id)
          }
        />
      </Card>

      <Card title="Pengeluaran">
        <List
          items={expenses}
          type="expense"
          edit={(item) =>
            edit("expense", item)
          }
          del={(id) =>
            del("expenses", id)
          }
        />
      </Card>
    </div>
  );
}

function List({
  items,
  type,
  edit,
  del,
}) {
  if (!items.length) {
    return <Empty />;
  }

  return (
    <div className="list">
      {items.map((item) => (
        <div
          className="list-item"
          key={item.id}
        >
          <div className="list-icon">
            {type === "income" ? (
              <ArrowUpCircle />
            ) : (
              <ArrowDownCircle />
            )}
          </div>

          <div className="list-main">
            <b>
              {type === "income"
                ? item.owner
                : item.name}
            </b>

            <span>
              {type === "income"
                ? item.description ||
                  "Pemasukan"
                : item.category ||
                  "Lainnya"}{" "}
              ·{" "}
              {dateText(
                item.transaction_date
              )}
            </span>
          </div>

          <strong
            className={
              type === "expense"
                ? "negative"
                : ""
            }
          >
            {type === "expense"
              ? "-"
              : ""}
            {money(item.amount)}
          </strong>

          <button
            className="icon-btn"
            onClick={() =>
              edit(item)
            }
            title="Edit"
          >
            <Edit3 size={15} />
          </button>

          <button
            className="icon-btn danger"
            onClick={() =>
              del(item.id)
            }
            title="Hapus"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   DEBTS
========================================================= */

function Debts({
  debts,
  payments,
  add,
  edit,
  pay,
  del,
}) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Cicilan / Utang</b>

          <span>
            Bayar akan mengurangi sisa
            utang.
          </span>
        </div>

        <button
          className="btn primary"
          onClick={add}
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      <Card title="Daftar Utang">
        {debts.length ? (
          <div className="debt-grid">
            {debts.map((debt) => (
              <div
                className="debt-card"
                key={debt.id}
              >
                <div className="debt-top">
                  <b>{debt.name}</b>

                  <span>
                    {dateText(
                      debt.transaction_date
                    )}
                  </span>
                </div>

                <div className="debt-number">
                  {money(
                    debt.remaining
                  )}
                </div>

                <small>
                  Sisa dari{" "}
                  {money(debt.amount)}
                </small>

                <div className="progress">
                  <i
                    style={{
                      width: `${percent(
                        Number(
                          debt.amount
                        ) -
                          Number(
                            debt.remaining
                          ),
                        debt.amount
                      )}%`,
                    }}
                  />
                </div>

                <div className="row-actions">
                  <button
                    className="btn primary"
                    onClick={() =>
                      pay(debt)
                    }
                    disabled={
                      Number(
                        debt.remaining
                      ) <= 0
                    }
                  >
                    {Number(
                      debt.remaining
                    ) <= 0
                      ? "Lunas"
                      : "Bayar"}
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() =>
                      edit(debt)
                    }
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      del(
                        "debts",
                        debt.id
                      )
                    }
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      <Card title="Riwayat Pembayaran">
        {payments.length ? (
          <div className="list">
            {payments.map(
              (payment) => (
                <div
                  className="list-item"
                  key={payment.id}
                >
                  <div className="list-icon">
                    <Check />
                  </div>

                  <div className="list-main">
                    <b>
                      {debts.find(
                        (debt) =>
                          debt.id ===
                          payment.debt_id
                      )?.name ||
                        "Utang"}
                    </b>

                    <span>
                      {dateText(
                        payment.payment_date
                      )}{" "}
                      ·{" "}
                      {payment.note ||
                        "Pembayaran"}
                    </span>
                  </div>

                  <strong>
                    {money(
                      payment.amount
                    )}
                  </strong>

                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      del(
                        "debt_payments",
                        payment.id
                      )
                    }
                    title="Hapus pembayaran"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <Empty />
        )}
      </Card>
    </div>
  );
}

/* =========================================================
   GOALS
========================================================= */

function Goals({
  goals,
  add,
  edit,
  del,
}) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Target Tabungan</b>

          <span>
            Progress tersimpan realtime.
          </span>
        </div>

        <button
          className="btn primary"
          onClick={add}
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      <div className="goal-grid">
        {goals.length ? (
          goals.map((goal) => (
            <Card
              key={goal.id}
              title={goal.name}
              action={
                <div className="item-actions">
                  <button
                    className="icon-btn"
                    onClick={() =>
                      edit(goal)
                    }
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      del(
                        "goals",
                        goal.id
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              }
            >
              <div className="big-percent">
                {Math.round(
                  percent(
                    goal.saved,
                    goal.target
                  )
                )}
                %
              </div>

              <div className="progress big">
                <i
                  style={{
                    width: `${percent(
                      goal.saved,
                      goal.target
                    )}%`,
                  }}
                />
              </div>

              <div className="goal-meta">
                <span>
                  {money(goal.saved)}{" "}
                  terkumpul
                </span>

                <span>
                  Target{" "}
                  {money(goal.target)}
                </span>
              </div>

              <small>
                {goal.monthly
                  ? `${money(
                      goal.monthly
                    )}/bulan · `
                  : ""}

                {goal.target_date
                  ? `Target ${dateText(
                      goal.target_date
                    )}`
                  : "Tanggal belum diatur"}
              </small>
            </Card>
          ))
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   BUDGET
========================================================= */

function Budget({
  budgets,
  expenses,
  add,
  edit,
  del,
}) {
  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Budget Bulanan</b>

          <span>
            Atur batas pengeluaran per
            kategori.
          </span>
        </div>

        <button
          className="btn primary"
          onClick={add}
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      <Card title="Budget">
        {budgets.length ? (
          <div className="budget-list">
            {budgets.map((budget) => {
              const spent = expenses
                .filter(
                  (item) =>
                    (item.category ||
                      "Lainnya") ===
                    budget.category
                )
                .reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item.amount || 0
                    ),
                  0
                );

              const over =
                spent >
                Number(
                  budget.amount
                );

              return (
                <div
                  className="budget-row"
                  key={budget.id}
                >
                  <div>
                    <b>
                      {budget.category}
                    </b>

                    <span>
                      {money(spent)}{" "}
                      terpakai dari{" "}
                      {money(
                        budget.amount
                      )}
                    </span>
                  </div>

                  <div className="progress">
                    <i
                      style={{
                        width: `${percent(
                          spent,
                          budget.amount
                        )}%`,
                      }}
                    />
                  </div>

                  <strong
                    className={
                      over
                        ? "negative"
                        : ""
                    }
                  >
                    {Math.round(
                      percent(
                        spent,
                        budget.amount
                      )
                    )}
                    %
                  </strong>

                  <button
                    className="icon-btn"
                    onClick={() =>
                      edit(budget)
                    }
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      del(
                        "budgets",
                        budget.id
                      )
                    }
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
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

/* =========================================================
   REMINDERS
========================================================= */

function Reminders({
  reminders,
  add,
  edit,
  toggle,
  del,
}) {
  const due = reminders.filter(
    (item) =>
      !item.done &&
      item.reminder_date <= today()
  ).length;

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <b>Reminder</b>

          <span>
            {due
              ? `${due} reminder perlu diperhatikan.`
              : "Tidak ada reminder jatuh tempo."}
          </span>
        </div>

        <button
          className="btn primary"
          onClick={add}
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>

      <Card title="Daftar Reminder">
        {reminders.length ? (
          <div className="list">
            {reminders.map(
              (reminder) => (
                <div
                  className={`list-item ${
                    reminder.done
                      ? "done"
                      : ""
                  }`}
                  key={reminder.id}
                >
                  <button
                    className="check-btn"
                    onClick={() =>
                      toggle(reminder)
                    }
                    title="Tandai selesai"
                  >
                    {reminder.done ? (
                      <Check size={16} />
                    ) : null}
                  </button>

                  <div className="list-main">
                    <b>
                      {reminder.title}
                    </b>

                    <span>
                      {dateText(
                        reminder.reminder_date
                      )}{" "}
                      ·{" "}
                      {reminder.note ||
                        "Tanpa catatan"}
                    </span>
                  </div>

                  {!reminder.done &&
                    reminder.reminder_date <=
                      today() && (
                      <span className="badge">
                        Jatuh tempo
                      </span>
                    )}

                  <button
                    className="icon-btn"
                    onClick={() =>
                      edit(reminder)
                    }
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() =>
                      del(
                        "reminders",
                        reminder.id
                      )
                    }
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <Empty />
        )}
      </Card>
    </div>
  );
}

export default App;
