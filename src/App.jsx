import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Edit3,
  LogOut,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const HOUSEHOLD_ID = "a548fbaa-26c0-436a-bd3f-a7664639eccd";

const initialData = {
  income: [],
  expenses: [],
  debts: [],
  goals: [],
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

/* =========================
   LOGIN
========================= */

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      onLogin(data.session);
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <PiggyBank size={34} />
        </div>

        <h1>Nabung Bersama</h1>

        <p className="login-subtitle">
          Kelola keuangan Ahmed & Nia bersama-sama.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="primary-button login-button"
            disabled={loading}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard({
  totalIncome,
  totalExpenses,
  totalSaved,
  remaining,
}) {
  return (
    <div className="dashboard-grid">
      <StatCard
        title="Total Pemasukan"
        value={totalIncome}
        icon={<ArrowUpCircle size={25} />}
        type="income"
      />

      <StatCard
        title="Total Pengeluaran"
        value={totalExpenses}
        icon={<ArrowDownCircle size={25} />}
        type="expense"
      />

      <StatCard
        title="Total Tabungan"
        value={totalSaved}
        icon={<PiggyBank size={25} />}
        type="saving"
      />

      <StatCard
        title="Sisa Dana"
        value={remaining}
        icon={<Wallet size={25} />}
        type="remaining"
      />
    </div>
  );
}

function StatCard({ title, value, icon, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <div className="stat-title">
          {title}
        </div>

        <div className="stat-value">
          {formatRupiah(value)}
        </div>
      </div>
    </div>
  );
}

/* =========================
   ACTION BUTTON
========================= */

function ActionButton({ onClick, children }) {
  return (
    <button
      className="add-button"
      onClick={onClick}
    >
      <Plus size={18} />
      {children}
    </button>
  );
}

/* =========================
   TRANSACTION SECTION
========================= */

function TransactionSection({
  title,
  icon,
  items,
  type,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <section className="section-card">
      <div className="section-header">
        <div className="section-title">
          {icon}
          <h2>{title}</h2>
        </div>

        <ActionButton onClick={onAdd}>
          Tambah
        </ActionButton>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {icon}
          </div>

          <p>Belum ada data.</p>

          <span>
            Tambahkan data menggunakan tombol + Tambah.
          </span>
        </div>
      ) : (
        <div className="transaction-list">
          {items.map((item) => (
            <div
              className="transaction-item"
              key={item.id}
            >
              <div className="transaction-main">
                <div className="transaction-name">
                  {type === "income"
                    ? item.owner
                    : item.name}
                </div>

                <div className="transaction-description">
                  {type === "income"
                    ? item.description || "Pemasukan"
                    : type === "expense"
                    ? "Pengeluaran"
                    : type === "debt"
                    ? `Sisa: ${formatRupiah(
                        item.remaining
                      )}`
                    : `Terkumpul: ${formatRupiah(
                        item.saved
                      )}`}
                </div>

                <div className="transaction-date">
                  <CalendarDays size={14} />

                  {formatDate(
                    item.transaction_date ||
                      item.target_date ||
                      item.created_at?.split("T")[0]
                  )}
                </div>
              </div>

              <div className="transaction-right">
                <div
                  className={`transaction-amount ${
                    type === "expense"
                      ? "negative"
                      : ""
                  }`}
                >
                  {type === "expense" ? "-" : ""}

                  {formatRupiah(
                    type === "goal"
                      ? item.target
                      : type === "debt"
                      ? item.amount
                      : item.amount
                  )}
                </div>

                <div className="item-actions">
                  <button
                    className="icon-button edit"
                    onClick={() => onEdit(item)}
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    className="icon-button delete"
                    onClick={() =>
                      onDelete(item.id)
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   MODAL
========================= */

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================
   FORM ACTIONS
========================= */

function FormActions({
  onCancel,
  loading,
  submitText = "Simpan",
}) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="secondary-button"
        onClick={onCancel}
        disabled={loading}
      >
        Batal
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={loading}
      >
        {loading
          ? "Menyimpan..."
          : submitText}
      </button>
    </div>
  );
}

/* =========================
   INCOME FORM
========================= */

function IncomeForm({
  onSubmit,
  onCancel,
}) {
  const [owner, setOwner] =
    useState("Ahmed");

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [date, setDate] =
    useState(getToday());

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      owner,
      amount: Number(amount),
      description,
      transaction_date: date,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>Pemilik</label>

      <select
        value={owner}
        onChange={(e) =>
          setOwner(e.target.value)
        }
      >
        <option value="Ahmed">
          Ahmed
        </option>

        <option value="Nia">
          Nia
        </option>

        <option value="Lainnya">
          Lainnya
        </option>
      </select>

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 5000000"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
        required
      />

      <label>Keterangan</label>

      <input
        type="text"
        placeholder="Contoh: Gaji"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
        required
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  );
}

/* =========================
   EDIT INCOME
========================= */

function EditIncomeForm({
  item,
  onSubmit,
  onCancel,
}) {
  const [owner, setOwner] =
    useState(item.owner || "Ahmed");

  const [amount, setAmount] =
    useState(item.amount || "");

  const [description, setDescription] =
    useState(item.description || "");

  const [date, setDate] =
    useState(
      item.transaction_date ||
        getToday()
    );

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      owner,
      amount: Number(amount),
      description,
      transaction_date: date,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>Pemilik</label>

      <select
        value={owner}
        onChange={(e) =>
          setOwner(e.target.value)
        }
      >
        <option value="Ahmed">
          Ahmed
        </option>

        <option value="Nia">
          Nia
        </option>

        <option value="Lainnya">
          Lainnya
        </option>
      </select>

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
        required
      />

      <label>Keterangan</label>

      <input
        type="text"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
        required
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
        submitText="Update"
      />
    </form>
  );
}

/* =========================
   EXPENSE FORM
========================= */

function ExpenseForm({
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [date, setDate] =
    useState(getToday());

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      name,
      amount: Number(amount),
      transaction_date: date,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>
        Nama Pengeluaran
      </label>

      <input
        type="text"
        placeholder="Contoh: Makan"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        required
      />

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 100000"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
        required
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
        required
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  );
}

/* =========================
   EDIT EXPENSE
========================= */

function EditExpenseForm({
  item,
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState(item.name || "");

  const [amount, setAmount] =
    useState(item.amount || "");

  const [date, setDate] =
    useState(
      item.transaction_date ||
        getToday()
    );

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      name,
      amount: Number(amount),
      transaction_date: date,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>
        Nama Pengeluaran
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        required
      />

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
        required
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
        required
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
        submitText="Update"
      />
    </form>
  );
}

/* =========================
   DEBT FORM
========================= */

function DebtForm({
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [remaining, setRemaining] =
    useState("");

  const [date, setDate] =
    useState(getToday());

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      name,
      amount: Number(amount),
      remaining:
        remaining === ""
          ? Number(amount)
          : Number(remaining),
      transaction_date: date,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>
        Nama Cicilan / Utang
      </label>

      <input
        type="text"
        placeholder="Contoh: Cicilan Motor"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        required
      />

      <label>Total Utang</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 10000000"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
        required
      />

      <label>Sisa Utang</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 7000000"
        value={remaining}
        onChange={(e) =>
          setRemaining(e.target.value)
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
        required
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  );
}

/* =========================
   EDIT DEBT
========================= */

function EditDebtForm({
  item,
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState(item.name || "");

  const [amount, setAmount] =
    useState(item.amount || "");

  const [remaining, setRemaining] =
    useState(
      item.remaining || ""
    );

  const [date, setDate] =
    useState(
      item.transaction_date ||
        getToday()
    );

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      name,
      amount: Number(amount),
      remaining: Number(remaining),
      transaction_date: date,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>
        Nama Cicilan / Utang
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        required
      />

      <label>Total Utang</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
        required
      />

      <label>Sisa Utang</label>

      <input
        type="number"
        min="0"
        value={remaining}
        onChange={(e) =>
          setRemaining(e.target.value)
        }
        required
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
        required
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
        submitText="Update"
      />
    </form>
  );
}

/* =========================
   GOAL FORM
========================= */

function GoalForm({
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState("");

  const [target, setTarget] =
    useState("");

  const [saved, setSaved] =
    useState("");

  const [monthly, setMonthly] =
    useState("");

  const [targetDate, setTargetDate] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      name,
      target: Number(target),
      saved: Number(saved || 0),
      monthly: Number(monthly || 0),
      target_date:
        targetDate || null,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>Nama Target</label>

      <input
        type="text"
        placeholder="Contoh: Dana Pernikahan"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        required
      />

      <label>Target</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 50000000"
        value={target}
        onChange={(e) =>
          setTarget(e.target.value)
        }
        required
      />

      <label>
        Sudah Terkumpul
      </label>

      <input
        type="number"
        min="0"
        value={saved}
        onChange={(e) =>
          setSaved(e.target.value)
        }
      />

      <label>
        Target Tabungan / Bulan
      </label>

      <input
        type="number"
        min="0"
        value={monthly}
        onChange={(e) =>
          setMonthly(e.target.value)
        }
      />

      <label>
        Tanggal Target
      </label>

      <input
        type="date"
        value={targetDate}
        onChange={(e) =>
          setTargetDate(e.target.value)
        }
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  );
}

/* =========================
   EDIT GOAL
========================= */

function EditGoalForm({
  item,
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState(item.name || "");

  const [target, setTarget] =
    useState(item.target || "");

  const [saved, setSaved] =
    useState(item.saved || "");

  const [monthly, setMonthly] =
    useState(item.monthly || "");

  const [targetDate, setTargetDate] =
    useState(
      item.target_date || ""
    );

  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);

    await onSubmit({
      name,
      target: Number(target),
      saved: Number(saved || 0),
      monthly: Number(monthly || 0),
      target_date:
        targetDate || null,
    });

    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <label>Nama Target</label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        required
      />

      <label>Target</label>

      <input
        type="number"
        min="0"
        value={target}
        onChange={(e) =>
          setTarget(e.target.value)
        }
        required
      />

      <label>
        Sudah Terkumpul
      </label>

      <input
        type="number"
        min="0"
        value={saved}
        onChange={(e) =>
          setSaved(e.target.value)
        }
      />

      <label>
        Target Tabungan / Bulan
      </label>

      <input
        type="number"
        min="0"
        value={monthly}
        onChange={(e) =>
          setMonthly(e.target.value)
        }
      />

      <label>
        Tanggal Target
      </label>

      <input
        type="date"
        value={targetDate}
        onChange={(e) =>
          setTargetDate(e.target.value)
        }
      />

      <FormActions
        onCancel={onCancel}
        loading={loading}
        submitText="Update"
      />
    </form>
  );
}

/* =========================
   MAIN APP
========================= */

export default function App() {
  const [session, setSession] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [household, setHousehold] =
    useState(null);

  const [data, setData] =
    useState(initialData);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState("all");

  const [modal, setModal] =
    useState(null);

  const [editingItem, setEditingItem] =
    useState(null);

  /* =========================
     AUTH SESSION
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } =
        await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data.session);
      setUser(
        data.session?.user || null
      );

      setLoading(false);
    }

    initialize();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(
            session?.user || null
          );
          setLoading(false);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =========================
     HOUSEHOLD
  ========================= */

  useEffect(() => {
    if (!user) return;

    async function loadHousehold() {
      const { data, error } =
        await supabase
          .from("household_members")
          .select(`
            household_id,
            households (
              id,
              name
            )
          `)
          .eq("user_id", user.id)
          .eq(
            "household_id",
            HOUSEHOLD_ID
          )
          .single();

      if (error) {
        console.error(
          "Household error:",
          error
        );
        return;
      }

      setHousehold(
        data?.households || null
      );
    }

    loadHousehold();
  }, [user]);

  /* =========================
     LOAD INCOME
  ========================= */

  async function loadIncome() {
    const { data: rows, error } =
      await supabase
        .from("income")
        .select("*")
        .eq(
          "household_id",
          HOUSEHOLD_ID
        )
        .order(
          "transaction_date",
          { ascending: false }
        );

    if (error) {
      console.error(
        "Income error:",
        error
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      income: rows || [],
    }));
  }

  /* =========================
     LOAD EXPENSES
  ========================= */

  async function loadExpenses() {
    const { data: rows, error } =
      await supabase
        .from("expenses")
        .select("*")
        .eq(
          "household_id",
          HOUSEHOLD_ID
        )
        .order(
          "transaction_date",
          { ascending: false }
        );

    if (error) {
      console.error(
        "Expenses error:",
        error
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: rows || [],
    }));
  }

  /* =========================
     LOAD DEBTS
  ========================= */

  async function loadDebts() {
    const { data: rows, error } =
      await supabase
        .from("debts")
        .select("*")
        .eq(
          "household_id",
          HOUSEHOLD_ID
        )
        .order(
          "transaction_date",
          { ascending: false }
        );

    if (error) {
      console.error(
        "Debts error:",
        error
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      debts: rows || [],
    }));
  }

  /* =========================
     LOAD GOALS
  ========================= */

  async function loadGoals() {
    const { data: rows, error } =
      await supabase
        .from("goals")
        .select("*")
        .eq(
          "household_id",
          HOUSEHOLD_ID
        )
        .order(
          "created_at",
          { ascending: false }
        );

    if (error) {
      console.error(
        "Goals error:",
        error
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      goals: rows || [],
    }));
  }

  /* ==================================================
     REALTIME SEMUA MODULE
  ================================================== */

  useEffect(() => {
    if (!user || !household) return;

    loadIncome();
    loadExpenses();
    loadDebts();
    loadGoals();

    /* =========================
       INCOME REALTIME
    ========================= */

    const incomeChannel =
      supabase
        .channel("income-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "income",
            filter: `household_id=eq.${HOUSEHOLD_ID}`,
          },
          () => {
            loadIncome();
          }
        )
        .subscribe();

    /* =========================
       EXPENSE REALTIME
    ========================= */

    const expenseChannel =
      supabase
        .channel("expenses-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `household_id=eq.${HOUSEHOLD_ID}`,
          },
          () => {
            loadExpenses();
          }
        )
        .subscribe();

    /* =========================
       DEBT REALTIME
    ========================= */

    const debtChannel =
      supabase
        .channel("debts-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "debts",
            filter: `household_id=eq.${HOUSEHOLD_ID}`,
          },
          () => {
            loadDebts();
          }
        )
        .subscribe();

    /* =========================
       GOAL REALTIME
    ========================= */

    const goalChannel =
      supabase
        .channel("goals-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "goals",
            filter: `household_id=eq.${HOUSEHOLD_ID}`,
          },
          () => {
            loadGoals();
          }
        )
        .subscribe();

    /* =========================
       CLEANUP
    ========================= */

    return () => {
      supabase.removeChannel(
        incomeChannel
      );

      supabase.removeChannel(
        expenseChannel
      );

      supabase.removeChannel(
        debtChannel
      );

      supabase.removeChannel(
        goalChannel
      );
    };
  }, [user, household]);

  /* =========================
     FILTER INCOME
  ========================= */

  const filteredIncome = useMemo(() => {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      now.getMonth() + 1;

    if (filter === "all") {
      return data.income;
    }

    return data.income.filter(
      (item) => {
        if (!item.transaction_date) {
          return false;
        }

        const date = new Date(
          `${item.transaction_date}T00:00:00`
        );

        if (filter === "year") {
          return (
            date.getFullYear() ===
            year
          );
        }

        if (filter === "month") {
          return (
            date.getFullYear() ===
              year &&
            date.getMonth() + 1 ===
              month
          );
        }

        return true;
      }
    );
  }, [
    data.income,
    filter,
  ]);

  /* =========================
     FILTER EXPENSE
  ========================= */

  const filteredExpenses =
    useMemo(() => {
      const now = new Date();

      const year =
        now.getFullYear();

      const month =
        now.getMonth() + 1;

      if (filter === "all") {
        return data.expenses;
      }

      return data.expenses.filter(
        (item) => {
          if (
            !item.transaction_date
          ) {
            return false;
          }

          const date = new Date(
            `${item.transaction_date}T00:00:00`
          );

          if (filter === "year") {
            return (
              date.getFullYear() ===
              year
            );
          }

          if (filter === "month") {
            return (
              date.getFullYear() ===
                year &&
              date.getMonth() + 1 ===
                month
            );
          }

          return true;
        }
      );
    }, [
      data.expenses,
      filter,
    ]);

  /* =========================
     DASHBOARD CALCULATION
  ========================= */

  const totalIncome =
    filteredIncome.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0
    );

  const totalExpenses =
    filteredExpenses.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0
    );

  const totalSaved =
    data.goals.reduce(
      (sum, item) =>
        sum +
        Number(item.saved || 0),
      0
    );

  const remaining =
    totalIncome -
    totalExpenses;

  /* =========================
     INCOME CRUD
  ========================= */

  async function addIncome(payload) {
    const { error } =
      await supabase
        .from("income")
        .insert({
          ...payload,
          household_id:
            HOUSEHOLD_ID,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    loadIncome();
  }

  async function updateIncome(
    id,
    payload
  ) {
    const { error } =
      await supabase
        .from("income")
        .update(payload)
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    setEditingItem(null);

    loadIncome();
  }

  async function deleteIncome(id) {
    if (
      !window.confirm(
        "Hapus data pemasukan ini?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("income")
        .delete()
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    loadIncome();
  }

  /* =========================
     EXPENSE CRUD
  ========================= */

  async function addExpense(payload) {
    const { error } =
      await supabase
        .from("expenses")
        .insert({
          ...payload,
          household_id:
            HOUSEHOLD_ID,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    loadExpenses();
  }

  async function updateExpense(
    id,
    payload
  ) {
    const { error } =
      await supabase
        .from("expenses")
        .update(payload)
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    setEditingItem(null);

    loadExpenses();
  }

  async function deleteExpense(id) {
    if (
      !window.confirm(
        "Hapus data pengeluaran ini?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    loadExpenses();
  }

  /* =========================
     DEBT CRUD
  ========================= */

  async function addDebt(payload) {
    const { error } =
      await supabase
        .from("debts")
        .insert({
          ...payload,
          household_id:
            HOUSEHOLD_ID,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    loadDebts();
  }

  async function updateDebt(
    id,
    payload
  ) {
    const { error } =
      await supabase
        .from("debts")
        .update(payload)
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    setEditingItem(null);

    loadDebts();
  }

  async function deleteDebt(id) {
    if (
      !window.confirm(
        "Hapus data cicilan/utang ini?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("debts")
        .delete()
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    loadDebts();
  }

  /* =========================
     GOAL CRUD
  ========================= */

  async function addGoal(payload) {
    const { error } =
      await supabase
        .from("goals")
        .insert({
          ...payload,
          household_id:
            HOUSEHOLD_ID,
        });

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    loadGoals();
  }

  async function updateGoal(
    id,
    payload
  ) {
    const { error } =
      await supabase
        .from("goals")
        .update(payload)
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    setModal(null);
    setEditingItem(null);

    loadGoals();
  }

  async function deleteGoal(id) {
    if (
      !window.confirm(
        "Hapus target tabungan ini?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("goals")
        .delete()
        .eq("id", id)
        .eq(
          "household_id",
          HOUSEHOLD_ID
        );

    if (error) {
      alert(error.message);
      return;
    }

    loadGoals();
  }

  /* =========================
     LOGOUT
  ========================= */

  async function logout() {
    await supabase.auth.signOut();
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>

        <p>
          Memuat Nabung Bersama...
        </p>
      </div>
    );
  }

  /* =========================
     LOGIN
  ========================= */

  if (!session) {
    return (
      <LoginScreen
        onLogin={setSession}
      />
    );
  }

  /* =========================
     APP UI
  ========================= */

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <PiggyBank size={25} />
          </div>

          <div>
            <h1>
              Nabung Bersama
            </h1>

            <span>
              {household?.name ||
                "Ahmed & Nia"}
            </span>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          <LogOut size={17} />
          Keluar
        </button>
      </header>

      <main className="container">
        <div className="welcome-section">
          <div>
            <p className="eyebrow">
              FINANCIAL PLANNER
            </p>

            <h2>
              Halo,{" "}
              {user?.email?.split(
                "@"
              )[0]}{" "}
              👋
            </h2>

            <p>
              Pantau pemasukan,
              pengeluaran, cicilan,
              dan target tabungan
              kalian.
            </p>
          </div>

          <div className="filter-wrapper">
            <span>Filter</span>

            <div className="filter-select">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value
                  )
                }
              >
                <option value="all">
                  Semua
                </option>

                <option value="year">
                  Tahun Ini
                </option>

                <option value="month">
                  Bulan Ini
                </option>
              </select>

              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <Dashboard
          totalIncome={
            totalIncome
          }
          totalExpenses={
            totalExpenses
          }
          totalSaved={
            totalSaved
          }
          remaining={
            remaining
          }
        />

        <div className="sections">
          {/* PEMASUKAN */}

          <TransactionSection
            title="Pemasukan"
            icon={
              <ArrowUpCircle
                size={21}
              />
            }
            items={
              filteredIncome
            }
            type="income"
            onAdd={() => {
              setEditingItem(
                null
              );

              setModal(
                "add-income"
              );
            }}
            onEdit={(item) => {
              setEditingItem(
                item
              );

              setModal(
                "edit-income"
              );
            }}
            onDelete={
              deleteIncome
            }
          />

          {/* PENGELUARAN */}

          <TransactionSection
            title="Pengeluaran"
            icon={
              <ArrowDownCircle
                size={21}
              />
            }
            items={
              filteredExpenses
            }
            type="expense"
            onAdd={() => {
              setEditingItem(
                null
              );

              setModal(
                "add-expense"
              );
            }}
            onEdit={(item) => {
              setEditingItem(
                item
              );

              setModal(
                "edit-expense"
              );
            }}
            onDelete={
              deleteExpense
            }
          />

          {/* CICILAN */}

          <TransactionSection
            title="Cicilan / Utang"
            icon={
              <CreditCard
                size={21}
              />
            }
            items={data.debts}
            type="debt"
            onAdd={() => {
              setEditingItem(
                null
              );

              setModal(
                "add-debt"
              );
            }}
            onEdit={(item) => {
              setEditingItem(
                item
              );

              setModal(
                "edit-debt"
              );
            }}
            onDelete={
              deleteDebt
            }
          />

          {/* TARGET */}

          <TransactionSection
            title="Target Tabungan"
            icon={
              <Target size={21} />
            }
            items={data.goals}
            type="goal"
            onAdd={() => {
              setEditingItem(
                null
              );

              setModal(
                "add-goal"
              );
            }}
            onEdit={(item) => {
              setEditingItem(
                item
              );

              setModal(
                "edit-goal"
              );
            }}
            onDelete={
              deleteGoal
            }
          />
        </div>
      </main>

      {/* =========================
          MODALS
      ========================= */}

      {modal === "add-income" && (
        <Modal
          title="Tambah Pemasukan"
          onClose={() =>
            setModal(null)
          }
        >
          <IncomeForm
            onSubmit={
              addIncome
            }
            onCancel={() =>
              setModal(null)
            }
          />
        </Modal>
      )}

      {modal === "edit-income" &&
        editingItem && (
          <Modal
            title="Edit Pemasukan"
            onClose={() => {
              setModal(null);
              setEditingItem(
                null
              );
            }}
          >
            <EditIncomeForm
              item={
                editingItem
              }
              onSubmit={(
                payload
              ) =>
                updateIncome(
                  editingItem.id,
                  payload
                )
              }
              onCancel={() => {
                setModal(null);
                setEditingItem(
                  null
                );
              }}
            />
          </Modal>
        )}

      {modal === "add-expense" && (
        <Modal
          title="Tambah Pengeluaran"
          onClose={() =>
            setModal(null)
          }
        >
          <ExpenseForm
            onSubmit={
              addExpense
            }
            onCancel={() =>
              setModal(null)
            }
          />
        </Modal>
      )}

      {modal === "edit-expense" &&
        editingItem && (
          <Modal
            title="Edit Pengeluaran"
            onClose={() => {
              setModal(null);
              setEditingItem(
                null
              );
            }}
          >
            <EditExpenseForm
              item={
                editingItem
              }
              onSubmit={(
                payload
              ) =>
                updateExpense(
                  editingItem.id,
                  payload
                )
              }
              onCancel={() => {
                setModal(null);
                setEditingItem(
                  null
                );
              }}
            />
          </Modal>
        )}

      {modal === "add-debt" && (
        <Modal
          title="Tambah Cicilan / Utang"
          onClose={() =>
            setModal(null)
          }
        >
          <DebtForm
            onSubmit={
              addDebt
            }
            onCancel={() =>
              setModal(null)
            }
          />
        </Modal>
      )}

      {modal === "edit-debt" &&
        editingItem && (
          <Modal
            title="Edit Cicilan / Utang"
            onClose={() => {
              setModal(null);
              setEditingItem(
                null
              );
            }}
          >
            <EditDebtForm
              item={
                editingItem
              }
              onSubmit={(
                payload
              ) =>
                updateDebt(
                  editingItem.id,
                  payload
                )
              }
              onCancel={() => {
                setModal(null);
                setEditingItem(
                  null
                );
              }}
            />
          </Modal>
        )}

      {modal === "add-goal" && (
        <Modal
          title="Tambah Target Tabungan"
          onClose={() =>
            setModal(null)
          }
        >
          <GoalForm
            onSubmit={
              addGoal
            }
            onCancel={() =>
              setModal(null)
            }
          />
        </Modal>
      )}

      {modal === "edit-goal" &&
        editingItem && (
          <Modal
            title="Edit Target Tabungan"
            onClose={() => {
              setModal(null);
              setEditingItem(
                null
              );
            }}
          >
            <EditGoalForm
              item={
                editingItem
              }
              onSubmit={(
                payload
              ) =>
                updateGoal(
                  editingItem.id,
                  payload
                )
              }
              onCancel={() => {
                setModal(null);
                setEditingItem(
                  null
                );
              }}
            />
          </Modal>
        )}
    </div>
  );
}
