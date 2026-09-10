import { useEffect, useState } from "react";
import {
  Wallet,
  LogOut,
  Plus,
  X,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Target,
  CalendarDays,
  User,
  Lock,
  Loader2,
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

function getCurrentPeriod() {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

/* =========================================================
   LOGIN
========================================================= */

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    onLogin(data.user);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Wallet size={28} />
        </div>

        <h1>Nabung Bersama</h1>

        <p className="login-subtitle">
          Kelola keuangan bersama Ahmed & Nia
        </p>

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label>Email</label>

            <div className="input-with-icon">
              <User size={18} />

              <input
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>

            <div className="input-with-icon">
              <Lock size={18} />

              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="login-error">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <div className="login-info">
          Gunakan akun Ahmed atau Nia yang sudah dibuat di Supabase.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingHousehold, setLoadingHousehold] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadHousehold(session.user.id);
      }

      setCheckingAuth(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadHousehold(session.user.id);
      } else {
        setHousehold(null);
      }

      setCheckingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadHousehold = async (userId) => {
    setLoadingHousehold(true);
    setAuthError("");

    const { data, error } = await supabase
      .from("household_members")
      .select(`
        household_id,
        households (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .eq("household_id", HOUSEHOLD_ID)
      .single();

    setLoadingHousehold(false);

    if (error) {
      console.error("Gagal mengambil household:", error);

      setAuthError(
        "Akun berhasil login, tetapi household Ahmed & Nia belum dapat diakses."
      );

      return;
    }

    setHousehold(data?.households ?? null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setHousehold(null);
  };

  if (checkingAuth) {
    return (
      <div className="loading-page">
        <Loader2 size={30} className="spin" />
        <p>Memeriksa sesi...</p>
      </div>
    );
  }

  if (!session || !user) {
    return <LoginScreen onLogin={setUser} />;
  }

  if (loadingHousehold) {
    return (
      <div className="loading-page">
        <Loader2 size={30} className="spin" />
        <p>Menghubungkan ke household...</p>
      </div>
    );
  }

  if (authError || !household) {
    return (
      <div className="loading-page">
        <div className="access-card">
          <Wallet size={34} />

          <h2>Akses Household Bermasalah</h2>

          <p>
            {authError ||
              "Household Nabung Bersama tidak ditemukan."}
          </p>

          <button
            className="secondary-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      household={household}
      onLogout={handleLogout}
    />
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ user, household, onLogout }) {
  const [data, setData] = useState(() => {
    try {
      const savedData = localStorage.getItem(
        "nabung-bersama-data"
      );

      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error(error);
    }

    return { ...initialData };
  });

  const [period, setPeriod] = useState("all");

  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showDebt, setShowDebt] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      "nabung-bersama-data",
      JSON.stringify(data)
    );
  }, [data]);

  const closeForms = () => {
    setShowIncome(false);
    setShowExpense(false);
    setShowDebt(false);
    setShowGoal(false);
    setEditing(null);
  };

  const addIncome = (item) => {
    setData((prev) => ({
      ...prev,
      income: [
        ...prev.income,
        {
          ...item,
          id: crypto.randomUUID(),
        },
      ],
    }));

    closeForms();
  };

  const addExpense = (item) => {
    setData((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          ...item,
          id: crypto.randomUUID(),
        },
      ],
    }));

    closeForms();
  };

  const addDebt = (item) => {
    setData((prev) => ({
      ...prev,
      debts: [
        ...prev.debts,
        {
          ...item,
          id: crypto.randomUUID(),
        },
      ],
    }));

    closeForms();
  };

  const addGoal = (item) => {
    setData((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          ...item,
          id: crypto.randomUUID(),
        },
      ],
    }));

    closeForms();
  };

  const deleteItem = (type, id) => {
    if (!window.confirm("Hapus data ini?")) return;

    setData((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  const startEdit = (type, item) => {
    setEditing({
      type,
      item,
    });
  };

  const updateItem = (updatedItem) => {
    const { type, item } = editing;

    setData((prev) => ({
      ...prev,
      [type]: prev[type].map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...updatedItem,
              id: item.id,
            }
          : currentItem
      ),
    }));

    setEditing(null);
  };

  const currentPeriod = getCurrentPeriod();

  const filterItems = (items) => {
    if (period === "all") return items;

    if (period === "year") {
      return items.filter(
        (item) => Number(item.year) === currentPeriod.year
      );
    }

    if (period === "month") {
      return items.filter(
        (item) =>
          Number(item.year) === currentPeriod.year &&
          Number(item.month) === currentPeriod.month
      );
    }

    return items;
  };

  const filteredIncome = filterItems(data.income);
  const filteredExpenses = filterItems(data.expenses);
  const filteredDebts = filterItems(data.debts);
  const filteredGoals = filterItems(data.goals);

  const totalIncome = filteredIncome.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalDebt = filteredDebts.reduce(
    (sum, item) => sum + Number(item.remaining || 0),
    0
  );

  const totalSaved = filteredGoals.reduce(
    (sum, item) => sum + Number(item.saved || 0),
    0
  );

  const remaining = totalIncome - totalExpenses;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>

          <div>
            <h1>Nabung Bersama</h1>
            <span>{household.name}</span>
          </div>
        </div>

        <div className="topbar-user">
          <span>{user.email}</span>

          <button
            className="logout-button"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="container">
        <section className="welcome-section">
          <div>
            <h2>Keuangan Bersama</h2>
            <p>
              Kelola pemasukan, pengeluaran, cicilan, dan
              target tabungan bersama.
            </p>
          </div>

          <div className="period-filter">
            <button
              className={period === "all" ? "active" : ""}
              onClick={() => setPeriod("all")}
            >
              Semua
            </button>

            <button
              className={period === "year" ? "active" : ""}
              onClick={() => setPeriod("year")}
            >
              Tahun
            </button>

            <button
              className={period === "month" ? "active" : ""}
              onClick={() => setPeriod("month")}
            >
              Bulan
            </button>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            icon={<ArrowUpCircle />}
            title="Total Pemasukan"
            value={totalIncome}
            type="income"
          />

          <StatCard
            icon={<ArrowDownCircle />}
            title="Total Pengeluaran"
            value={totalExpenses}
            type="expense"
          />

          <StatCard
            icon={<Target />}
            title="Total Tabungan"
            value={totalSaved}
            type="saving"
          />

          <StatCard
            icon={<Wallet />}
            title="Sisa Uang"
            value={remaining}
            type="remaining"
          />
        </section>

        <section className="action-grid">
          <ActionButton
            icon={<ArrowUpCircle />}
            title="Pemasukan"
            subtitle="Tambah pemasukan"
            onClick={() => setShowIncome(true)}
          />

          <ActionButton
            icon={<ArrowDownCircle />}
            title="Pengeluaran"
            subtitle="Tambah pengeluaran"
            onClick={() => setShowExpense(true)}
          />

          <ActionButton
            icon={<CreditCard />}
            title="Cicilan"
            subtitle="Kelola cicilan"
            onClick={() => setShowDebt(true)}
          />

          <ActionButton
            icon={<Target />}
            title="Target"
            subtitle="Target tabungan"
            onClick={() => setShowGoal(true)}
          />
        </section>

        <section className="content-grid">
          <TransactionSection
            title="Pemasukan"
            icon={<ArrowUpCircle />}
            items={filteredIncome}
            type="income"
            emptyText="Belum ada pemasukan."
            onEdit={startEdit}
            onDelete={deleteItem}
          />

          <TransactionSection
            title="Pengeluaran"
            icon={<ArrowDownCircle />}
            items={filteredExpenses}
            type="expenses"
            emptyText="Belum ada pengeluaran."
            onEdit={startEdit}
            onDelete={deleteItem}
          />

          <TransactionSection
            title="Cicilan"
            icon={<CreditCard />}
            items={filteredDebts}
            type="debts"
            emptyText="Belum ada cicilan."
            onEdit={startEdit}
            onDelete={deleteItem}
          />

          <TransactionSection
            title="Target Tabungan"
            icon={<Target />}
            items={filteredGoals}
            type="goals"
            emptyText="Belum ada target."
            onEdit={startEdit}
            onDelete={deleteItem}
          />
        </section>
      </main>

      {showIncome && (
        <Modal title="Tambah Pemasukan" onClose={closeForms}>
          <IncomeForm onSubmit={addIncome} onCancel={closeForms} />
        </Modal>
      )}

      {showExpense && (
        <Modal title="Tambah Pengeluaran" onClose={closeForms}>
          <ExpenseForm onSubmit={addExpense} onCancel={closeForms} />
        </Modal>
      )}

      {showDebt && (
        <Modal title="Tambah Cicilan" onClose={closeForms}>
          <DebtForm onSubmit={addDebt} onCancel={closeForms} />
        </Modal>
      )}

      {showGoal && (
        <Modal title="Tambah Target Tabungan" onClose={closeForms}>
          <GoalForm onSubmit={addGoal} onCancel={closeForms} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Data" onClose={() => setEditing(null)}>
          <EditForm
            type={editing.type}
            item={editing.item}
            onSubmit={updateItem}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({ icon, title, value, type }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{formatRupiah(value)}</strong>
      </div>
    </div>
  );
}

function ActionButton({ icon, title, subtitle, onClick }) {
  return (
    <button className="action-button" onClick={onClick}>
      <div className="action-icon">{icon}</div>

      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <Plus size={19} />
    </button>
  );
}

function TransactionSection({
  title,
  icon,
  items,
  type,
  emptyText,
  onEdit,
  onDelete,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-title">
          {icon}
          <h3>{title}</h3>
        </div>

        <span className="count-badge">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="transaction-list">
          {items.map((item) => (
            <div className="transaction-item" key={item.id}>
              <div className="transaction-main">
                <strong>
                  {item.description ||
                    item.name ||
                    "Tanpa keterangan"}
                </strong>

                {item.owner && (
                  <span className="transaction-owner">
                    {item.owner}
                  </span>
                )}

                {item.date && (
                  <span className="transaction-date">
                    {item.date}
                  </span>
                )}
              </div>

              <div className="transaction-right">
                <strong>
                  {formatRupiah(
                    item.amount ??
                      item.saved ??
                      item.target ??
                      item.remaining
                  )}
                </strong>

                <div className="item-actions">
                  <button
                    onClick={() => onEdit(type, item)}
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => onDelete(type, item.id)}
                    title="Hapus"
                  >
                    <Trash2 size={15} />
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

/* =========================================================
   MODAL
========================================================= */

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   FORM PEMASUKAN
========================================================= */

function IncomeForm({ onSubmit, onCancel }) {
  const current = getCurrentPeriod();

  const [owner, setOwner] = useState("Ahmed");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount) return;

    onSubmit({
      owner,
      amount: Number(amount),
      description,
      date,
      year: current.year,
      month: current.month,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>Pemasukan untuk</label>

      <select
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      >
        <option>Ahmed</option>
        <option>Nia</option>
        <option>Lainnya</option>
      </select>

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 5000000"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <label>Keterangan</label>

      <input
        type="text"
        placeholder="Contoh: Gaji"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <FormActions onCancel={onCancel} />
    </form>
  );
}

/* =========================================================
   FORM PENGELUARAN
========================================================= */

function ExpenseForm({ onSubmit, onCancel }) {
  const current = getCurrentPeriod();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount) return;

    onSubmit({
      name,
      amount: Number(amount),
      year: current.year,
      month: current.month,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>Keterangan</label>

      <input
        type="text"
        placeholder="Contoh: Makan"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 100000"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <FormActions onCancel={onCancel} />
    </form>
  );
}

/* =========================================================
   FORM CICILAN
========================================================= */

function DebtForm({ onSubmit, onCancel }) {
  const current = getCurrentPeriod();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [remaining, setRemaining] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount) return;

    onSubmit({
      name,
      amount: Number(amount),
      remaining: Number(remaining || amount),
      year: current.year,
      month: current.month,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>Nama Cicilan</label>

      <input
        type="text"
        placeholder="Contoh: Motor"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label>Total Cicilan</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <label>Sisa Cicilan</label>

      <input
        type="number"
        min="0"
        value={remaining}
        onChange={(e) => setRemaining(e.target.value)}
      />

      <FormActions onCancel={onCancel} />
    </form>
  );
}

/* =========================================================
   FORM TARGET
========================================================= */

function GoalForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [monthly, setMonthly] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !target) return;

    onSubmit({
      name,
      target: Number(target),
      saved: Number(saved || 0),
      monthly: Number(monthly || 0),
      target_date: targetDate,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>Nama Target</label>

      <input
        type="text"
        placeholder="Contoh: Dana Nikah"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label>Target</label>

      <input
        type="number"
        min="0"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />

      <label>Sudah Terkumpul</label>

      <input
        type="number"
        min="0"
        value={saved}
        onChange={(e) => setSaved(e.target.value)}
      />

      <label>Tabungan per Bulan</label>

      <input
        type="number"
        min="0"
        value={monthly}
        onChange={(e) => setMonthly(e.target.value)}
      />

      <label>Target Tanggal</label>

      <input
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
      />

      <FormActions onCancel={onCancel} />
    </form>
  );
}

/* =========================================================
   EDIT FORM
========================================================= */

function EditForm({ type, item, onSubmit, onCancel }) {
  const [name, setName] = useState(
    item.name || item.description || ""
  );

  const [amount, setAmount] = useState(
    item.amount ?? ""
  );

  const [owner, setOwner] = useState(
    item.owner || "Ahmed"
  );

  const [saved, setSaved] = useState(
    item.saved ?? ""
  );

  const [target, setTarget] = useState(
    item.target ?? ""
  );

  const [remaining, setRemaining] = useState(
    item.remaining ?? ""
  );

  const [monthly, setMonthly] = useState(
    item.monthly ?? ""
  );

  const [date, setDate] = useState(
    item.date || item.target_date || ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (type === "income") {
      onSubmit({
        ...item,
        owner,
        description: name,
        amount: Number(amount),
        date,
      });

      return;
    }

    if (type === "expenses") {
      onSubmit({
        ...item,
        name,
        amount: Number(amount),
      });

      return;
    }

    if (type === "debts") {
      onSubmit({
        ...item,
        name,
        amount: Number(amount),
        remaining: Number(remaining),
      });

      return;
    }

    if (type === "goals") {
      onSubmit({
        ...item,
        name,
        target: Number(target),
        saved: Number(saved),
        monthly: Number(monthly),
        target_date: date,
      });
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>Nama / Keterangan</label>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {type === "income" && (
        <>
          <label>Pemilik</label>

          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option>Ahmed</option>
            <option>Nia</option>
            <option>Lainnya</option>
          </select>
        </>
      )}

      {type !== "goals" && (
        <>
          <label>Nominal</label>

          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </>
      )}

      {type === "debts" && (
        <>
          <label>Sisa Cicilan</label>

          <input
            type="number"
            min="0"
            value={remaining}
            onChange={(e) =>
              setRemaining(e.target.value)
            }
          />
        </>
      )}

      {type === "goals" && (
        <>
          <label>Target</label>

          <input
            type="number"
            min="0"
            value={target}
            onChange={(e) =>
              setTarget(e.target.value)
            }
          />

          <label>Sudah Terkumpul</label>

          <input
            type="number"
            min="0"
            value={saved}
            onChange={(e) =>
              setSaved(e.target.value)
            }
          />

          <label>Tabungan per Bulan</label>

          <input
            type="number"
            min="0"
            value={monthly}
            onChange={(e) =>
              setMonthly(e.target.value)
            }
          />

          <label>Target Tanggal</label>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
          />
        </>
      )}

      {type === "income" && (
        <>
          <label>Tanggal</label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </>
      )}

      <FormActions onCancel={onCancel} />
    </form>
  );
}

/* =========================================================
   FORM ACTIONS
========================================================= */

function FormActions({ onCancel }) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="cancel-button"
        onClick={onCancel}
      >
        Batal
      </button>

      <button
        type="submit"
        className="primary-button"
      >
        Simpan
      </button>
    </div>
  );
}
