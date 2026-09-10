import { useEffect, useMemo, useState } from "react";
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
  User,
  Lock,
  Loader2,
} from "lucide-react";

import { supabase } from "./lib/supabase";

const HOUSEHOLD_ID =
  "a548fbaa-26c0-436a-bd3f-a7664639eccd";

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

function getToday() {
  return new Date().toISOString().slice(0, 10);
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

    const { data, error } =
      await supabase.auth.signInWithPassword({
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
          Gunakan akun Ahmed atau Nia yang sudah dibuat di
          Supabase.
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
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadHousehold(newSession.user.id);
        } else {
          setHousehold(null);
        }

        setCheckingAuth(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
  const [data, setData] = useState(initialData);

  const [incomeLoading, setIncomeLoading] = useState(true);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [debtLoading, setDebtLoading] = useState(true);
  const [goalLoading, setGoalLoading] = useState(true);

  const [incomeError, setIncomeError] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const [debtError, setDebtError] = useState("");
  const [goalError, setGoalError] = useState("");

  const [incomeSaving, setIncomeSaving] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [debtSaving, setDebtSaving] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);

  const [period, setPeriod] = useState("all");

  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showDebt, setShowDebt] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const [editing, setEditing] = useState(null);

  /* =======================================================
     LOAD INCOME
  ======================================================= */

  const loadIncome = async () => {
    setIncomeLoading(true);
    setIncomeError("");

    const { data: rows, error } = await supabase
      .from("income")
      .select(
        "id, owner, description, amount, transaction_date, created_at, household_id"
      )
      .eq("household_id", HOUSEHOLD_ID)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil income:", error);

      setIncomeError(
        `Pemasukan belum dapat dimuat: ${error.message}`
      );

      setIncomeLoading(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      income: (rows || []).map((item) => ({
        id: item.id,
        owner: item.owner,
        description: item.description,
        amount: Number(item.amount || 0),
        date: item.transaction_date,
        transaction_date: item.transaction_date,
        created_at: item.created_at,
        household_id: item.household_id,
      })),
    }));

    setIncomeLoading(false);
  };

  /* =======================================================
     LOAD EXPENSES
  ======================================================= */

  const loadExpenses = async () => {
    setExpenseLoading(true);
    setExpenseError("");

    const { data: rows, error } = await supabase
      .from("expenses")
      .select(
        "id, name, amount, transaction_date, created_at, household_id"
      )
      .eq("household_id", HOUSEHOLD_ID)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil expenses:", error);

      setExpenseError(
        `Pengeluaran belum dapat dimuat: ${error.message}`
      );

      setExpenseLoading(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: (rows || []).map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount || 0),
        date: item.transaction_date,
        transaction_date: item.transaction_date,
        created_at: item.created_at,
        household_id: item.household_id,
      })),
    }));

    setExpenseLoading(false);
  };

  /* =======================================================
     LOAD DEBTS
  ======================================================= */

  const loadDebts = async () => {
    setDebtLoading(true);
    setDebtError("");

    const { data: rows, error } = await supabase
      .from("debts")
      .select(
        "id, name, amount, remaining, transaction_date, created_at, household_id"
      )
      .eq("household_id", HOUSEHOLD_ID)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil debts:", error);

      setDebtError(
        `Cicilan belum dapat dimuat: ${error.message}`
      );

      setDebtLoading(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      debts: (rows || []).map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount || 0),
        remaining: Number(item.remaining || 0),
        date: item.transaction_date,
        transaction_date: item.transaction_date,
        created_at: item.created_at,
        household_id: item.household_id,
      })),
    }));

    setDebtLoading(false);
  };

  /* =======================================================
     LOAD GOALS
  ======================================================= */

  const loadGoals = async () => {
    setGoalLoading(true);
    setGoalError("");

    const { data: rows, error } = await supabase
      .from("goals")
      .select(
        "id, name, target, saved, monthly, target_date, created_at, household_id"
      )
      .eq("household_id", HOUSEHOLD_ID)
      .order("target_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil goals:", error);

      setGoalError(
        `Target tabungan belum dapat dimuat: ${error.message}`
      );

      setGoalLoading(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      goals: (rows || []).map((item) => ({
        id: item.id,
        name: item.name,
        target: Number(item.target || 0),
        saved: Number(item.saved || 0),
        monthly: Number(item.monthly || 0),
        target_date: item.target_date,
        created_at: item.created_at,
        household_id: item.household_id,
      })),
    }));

    setGoalLoading(false);
  };

  useEffect(() => {
  loadIncome();
  loadExpenses();
  loadDebts();
  loadGoals();

  const incomeChannel = supabase
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

  const expenseChannel = supabase
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

  return () => {
    supabase.removeChannel(incomeChannel);
    supabase.removeChannel(expenseChannel);
  };
}, []);

  /* =======================================================
     CLOSE FORMS
  ======================================================= */

  const closeForms = () => {
    setShowIncome(false);
    setShowExpense(false);
    setShowDebt(false);
    setShowGoal(false);
    setEditing(null);
  };

  /* =======================================================
     INCOME CRUD
  ======================================================= */

  const addIncome = async (item) => {
    setIncomeSaving(true);
    setIncomeError("");

    const { data: inserted, error } = await supabase
      .from("income")
      .insert({
        owner: item.owner,
        description: item.description || null,
        amount: Number(item.amount),
        transaction_date: item.date,
        household_id: HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      setIncomeError(
        `Gagal menyimpan pemasukan: ${error.message}`
      );
      setIncomeSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      income: [
        {
          id: inserted.id,
          owner: inserted.owner,
          description: inserted.description,
          amount: Number(inserted.amount || 0),
          date: inserted.transaction_date,
          transaction_date: inserted.transaction_date,
          created_at: inserted.created_at,
          household_id: inserted.household_id,
        },
        ...prev.income,
      ],
    }));

    setIncomeSaving(false);
    closeForms();
  };

  const updateIncome = async (item) => {
    setIncomeSaving(true);
    setIncomeError("");

    const { data: updated, error } = await supabase
      .from("income")
      .update({
        owner: item.owner,
        description: item.description || null,
        amount: Number(item.amount),
        transaction_date: item.date,
      })
      .eq("id", item.id)
      .eq("household_id", HOUSEHOLD_ID)
      .select()
      .single();

    if (error) {
      setIncomeError(
        `Gagal mengubah pemasukan: ${error.message}`
      );
      setIncomeSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      income: prev.income.map((current) =>
        current.id === updated.id
          ? {
              id: updated.id,
              owner: updated.owner,
              description: updated.description,
              amount: Number(updated.amount || 0),
              date: updated.transaction_date,
              transaction_date: updated.transaction_date,
              created_at: updated.created_at,
              household_id: updated.household_id,
            }
          : current
      ),
    }));

    setIncomeSaving(false);
    setEditing(null);
  };

  const deleteIncome = async (id) => {
    if (!window.confirm("Hapus pemasukan ini?")) {
      return;
    }

    setIncomeSaving(true);
    setIncomeError("");

    const { error } = await supabase
      .from("income")
      .delete()
      .eq("id", id)
      .eq("household_id", HOUSEHOLD_ID);

    if (error) {
      setIncomeError(
        `Gagal menghapus pemasukan: ${error.message}`
      );
      setIncomeSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      income: prev.income.filter(
        (item) => item.id !== id
      ),
    }));

    setIncomeSaving(false);
  };

  /* =======================================================
     EXPENSE CRUD
  ======================================================= */

  const addExpense = async (item) => {
    setExpenseSaving(true);
    setExpenseError("");

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert({
        name: item.name,
        amount: Number(item.amount),
        transaction_date: item.date,
        household_id: HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      setExpenseError(
        `Gagal menyimpan pengeluaran: ${error.message}`
      );
      setExpenseSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: [
        {
          id: inserted.id,
          name: inserted.name,
          amount: Number(inserted.amount || 0),
          date: inserted.transaction_date,
          transaction_date: inserted.transaction_date,
          created_at: inserted.created_at,
          household_id: inserted.household_id,
        },
        ...prev.expenses,
      ],
    }));

    setExpenseSaving(false);
    closeForms();
  };

  const updateExpense = async (item) => {
    setExpenseSaving(true);
    setExpenseError("");

    const { data: updated, error } = await supabase
      .from("expenses")
      .update({
        name: item.name,
        amount: Number(item.amount),
        transaction_date: item.date,
      })
      .eq("id", item.id)
      .eq("household_id", HOUSEHOLD_ID)
      .select()
      .single();

    if (error) {
      setExpenseError(
        `Gagal mengubah pengeluaran: ${error.message}`
      );
      setExpenseSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((current) =>
        current.id === updated.id
          ? {
              id: updated.id,
              name: updated.name,
              amount: Number(updated.amount || 0),
              date: updated.transaction_date,
              transaction_date: updated.transaction_date,
              created_at: updated.created_at,
              household_id: updated.household_id,
            }
          : current
      ),
    }));

    setExpenseSaving(false);
    setEditing(null);
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Hapus pengeluaran ini?")) {
      return;
    }

    setExpenseSaving(true);
    setExpenseError("");

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("household_id", HOUSEHOLD_ID);

    if (error) {
      setExpenseError(
        `Gagal menghapus pengeluaran: ${error.message}`
      );
      setExpenseSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter(
        (item) => item.id !== id
      ),
    }));

    setExpenseSaving(false);
  };

  /* =======================================================
     DEBT CRUD
  ======================================================= */

  const addDebt = async (item) => {
    setDebtSaving(true);
    setDebtError("");

    const { data: inserted, error } = await supabase
      .from("debts")
      .insert({
        name: item.name,
        amount: Number(item.amount),
        remaining: Number(item.remaining),
        transaction_date: item.date,
        household_id: HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      setDebtError(
        `Gagal menyimpan cicilan: ${error.message}`
      );
      setDebtSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      debts: [
        {
          id: inserted.id,
          name: inserted.name,
          amount: Number(inserted.amount || 0),
          remaining: Number(inserted.remaining || 0),
          date: inserted.transaction_date,
          transaction_date: inserted.transaction_date,
          created_at: inserted.created_at,
          household_id: inserted.household_id,
        },
        ...prev.debts,
      ],
    }));

    setDebtSaving(false);
    closeForms();
  };

  const updateDebt = async (item) => {
    setDebtSaving(true);
    setDebtError("");

    const { data: updated, error } = await supabase
      .from("debts")
      .update({
        name: item.name,
        amount: Number(item.amount),
        remaining: Number(item.remaining),
        transaction_date: item.date,
      })
      .eq("id", item.id)
      .eq("household_id", HOUSEHOLD_ID)
      .select()
      .single();

    if (error) {
      setDebtError(
        `Gagal mengubah cicilan: ${error.message}`
      );
      setDebtSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((current) =>
        current.id === updated.id
          ? {
              id: updated.id,
              name: updated.name,
              amount: Number(updated.amount || 0),
              remaining: Number(updated.remaining || 0),
              date: updated.transaction_date,
              transaction_date: updated.transaction_date,
              created_at: updated.created_at,
              household_id: updated.household_id,
            }
          : current
      ),
    }));

    setDebtSaving(false);
    setEditing(null);
  };

  const deleteDebt = async (id) => {
    if (!window.confirm("Hapus cicilan ini?")) {
      return;
    }

    setDebtSaving(true);
    setDebtError("");

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("id", id)
      .eq("household_id", HOUSEHOLD_ID);

    if (error) {
      setDebtError(
        `Gagal menghapus cicilan: ${error.message}`
      );
      setDebtSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      debts: prev.debts.filter(
        (item) => item.id !== id
      ),
    }));

    setDebtSaving(false);
  };

  /* =======================================================
     GOAL CRUD → SUPABASE
  ======================================================= */

  const addGoal = async (item) => {
    setGoalSaving(true);
    setGoalError("");

    const { data: inserted, error } = await supabase
      .from("goals")
      .insert({
        name: item.name,
        target: Number(item.target),
        saved: Number(item.saved || 0),
        monthly: Number(item.monthly || 0),
        target_date: item.target_date || null,
        household_id: HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      console.error("Gagal menyimpan goal:", error);

      setGoalError(
        `Gagal menyimpan target tabungan: ${error.message}`
      );

      setGoalSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      goals: [
        {
          id: inserted.id,
          name: inserted.name,
          target: Number(inserted.target || 0),
          saved: Number(inserted.saved || 0),
          monthly: Number(inserted.monthly || 0),
          target_date: inserted.target_date,
          created_at: inserted.created_at,
          household_id: inserted.household_id,
        },
        ...prev.goals,
      ],
    }));

    setGoalSaving(false);
    closeForms();
  };

  const updateGoal = async (item) => {
    setGoalSaving(true);
    setGoalError("");

    const { data: updated, error } = await supabase
      .from("goals")
      .update({
        name: item.name,
        target: Number(item.target),
        saved: Number(item.saved || 0),
        monthly: Number(item.monthly || 0),
        target_date: item.target_date || null,
      })
      .eq("id", item.id)
      .eq("household_id", HOUSEHOLD_ID)
      .select()
      .single();

    if (error) {
      console.error("Gagal update goal:", error);

      setGoalError(
        `Gagal mengubah target tabungan: ${error.message}`
      );

      setGoalSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((current) =>
        current.id === updated.id
          ? {
              id: updated.id,
              name: updated.name,
              target: Number(updated.target || 0),
              saved: Number(updated.saved || 0),
              monthly: Number(updated.monthly || 0),
              target_date: updated.target_date,
              created_at: updated.created_at,
              household_id: updated.household_id,
            }
          : current
      ),
    }));

    setGoalSaving(false);
    setEditing(null);
  };

  const deleteGoal = async (id) => {
    if (!window.confirm("Hapus target tabungan ini?")) {
      return;
    }

    setGoalSaving(true);
    setGoalError("");

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("household_id", HOUSEHOLD_ID);

    if (error) {
      console.error("Gagal menghapus goal:", error);

      setGoalError(
        `Gagal menghapus target tabungan: ${error.message}`
      );

      setGoalSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter(
        (item) => item.id !== id
      ),
    }));

    setGoalSaving(false);
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const startEdit = (type, item) => {
    setEditing({
      type,
      item,
    });
  };

  /* =======================================================
     FILTER
  ======================================================= */

  const isInPeriod = (dateString) => {
    if (period === "all") {
      return true;
    }

    if (!dateString) {
      return false;
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    const now = new Date();

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (period === "year") {
      return year === currentYear;
    }

    if (period === "month") {
      return (
        year === currentYear &&
        month === currentMonth
      );
    }

    return true;
  };

  const filteredIncome = useMemo(
    () =>
      data.income.filter((item) =>
        isInPeriod(item.transaction_date)
      ),
    [data.income, period]
  );

  const filteredExpenses = useMemo(
    () =>
      data.expenses.filter((item) =>
        isInPeriod(item.transaction_date)
      ),
    [data.expenses, period]
  );

  const filteredDebts = useMemo(
    () =>
      data.debts.filter((item) =>
        isInPeriod(item.transaction_date)
      ),
    [data.debts, period]
  );

  const filteredGoals = useMemo(() => {
    if (period === "all") {
      return data.goals;
    }

    return data.goals.filter((item) =>
      isInPeriod(item.target_date)
    );
  }, [data.goals, period]);

  /* =======================================================
     TOTAL
  ======================================================= */

  const totalIncome = filteredIncome.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalSaved = filteredGoals.reduce(
    (sum, item) =>
      sum + Number(item.saved || 0),
    0
  );

  const totalDebtRemaining = filteredDebts.reduce(
    (sum, item) =>
      sum + Number(item.remaining || 0),
    0
  );

  const remaining =
    totalIncome - totalExpenses;

  /* =======================================================
     RENDER
  ======================================================= */

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
              Kelola pemasukan, pengeluaran,
              cicilan, dan target tabungan bersama.
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

        {incomeError && (
          <div className="login-error page-error">
            {incomeError}
          </div>
        )}

        {expenseError && (
          <div className="login-error page-error">
            {expenseError}
          </div>
        )}

        {debtError && (
          <div className="login-error page-error">
            {debtError}
          </div>
        )}

        {goalError && (
          <div className="login-error page-error">
            {goalError}
          </div>
        )}

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
            emptyText={
              incomeLoading
                ? "Memuat pemasukan..."
                : "Belum ada pemasukan."
            }
            onEdit={startEdit}
            onDelete={deleteIncome}
            saving={incomeSaving}
          />

          <TransactionSection
            title="Pengeluaran"
            icon={<ArrowDownCircle />}
            items={filteredExpenses}
            type="expenses"
            emptyText={
              expenseLoading
                ? "Memuat pengeluaran..."
                : "Belum ada pengeluaran."
            }
            onEdit={startEdit}
            onDelete={deleteExpense}
            saving={expenseSaving}
          />

          <TransactionSection
            title="Cicilan"
            icon={<CreditCard />}
            items={filteredDebts}
            type="debts"
            emptyText={
              debtLoading
                ? "Memuat cicilan..."
                : "Belum ada cicilan."
            }
            onEdit={startEdit}
            onDelete={deleteDebt}
            saving={debtSaving}
          />

          <TransactionSection
            title="Target Tabungan"
            icon={<Target />}
            items={filteredGoals}
            type="goals"
            emptyText={
              goalLoading
                ? "Memuat target..."
                : "Belum ada target."
            }
            onEdit={startEdit}
            onDelete={deleteGoal}
            saving={goalSaving}
          />
        </section>

        {filteredDebts.length > 0 && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 15px",
              background: "#edf8f1",
              border: "1px solid #dff1e7",
              borderRadius: "12px",
              color: "#286049",
              fontSize: "12px",
            }}
          >
            Total sisa cicilan:{" "}
            <strong>
              {formatRupiah(totalDebtRemaining)}
            </strong>
          </div>
        )}
      </main>

      {/* ADD INCOME */}

      {showIncome && (
        <Modal
          title="Tambah Pemasukan"
          onClose={closeForms}
        >
          <IncomeForm
            onSubmit={addIncome}
            onCancel={closeForms}
            saving={incomeSaving}
          />
        </Modal>
      )}

      {/* ADD EXPENSE */}

      {showExpense && (
        <Modal
          title="Tambah Pengeluaran"
          onClose={closeForms}
        >
          <ExpenseForm
            onSubmit={addExpense}
            onCancel={closeForms}
            saving={expenseSaving}
          />
        </Modal>
      )}

      {/* ADD DEBT */}

      {showDebt && (
        <Modal
          title="Tambah Cicilan"
          onClose={closeForms}
        >
          <DebtForm
            onSubmit={addDebt}
            onCancel={closeForms}
            saving={debtSaving}
          />
        </Modal>
      )}

      {/* ADD GOAL */}

      {showGoal && (
        <Modal
          title="Tambah Target Tabungan"
          onClose={closeForms}
        >
          <GoalForm
            onSubmit={addGoal}
            onCancel={closeForms}
            saving={goalSaving}
          />
        </Modal>
      )}

      {/* EDIT INCOME */}

      {editing?.type === "income" && (
        <Modal
          title="Edit Pemasukan"
          onClose={() => setEditing(null)}
        >
          <EditIncomeForm
            item={editing.item}
            onSubmit={updateIncome}
            onCancel={() => setEditing(null)}
            saving={incomeSaving}
          />
        </Modal>
      )}

      {/* EDIT EXPENSE */}

      {editing?.type === "expenses" && (
        <Modal
          title="Edit Pengeluaran"
          onClose={() => setEditing(null)}
        >
          <EditExpenseForm
            item={editing.item}
            onSubmit={updateExpense}
            onCancel={() => setEditing(null)}
            saving={expenseSaving}
          />
        </Modal>
      )}

      {/* EDIT DEBT */}

      {editing?.type === "debts" && (
        <Modal
          title="Edit Cicilan"
          onClose={() => setEditing(null)}
        >
          <EditDebtForm
            item={editing.item}
            onSubmit={updateDebt}
            onCancel={() => setEditing(null)}
            saving={debtSaving}
          />
        </Modal>
      )}

      {/* EDIT GOAL */}

      {editing?.type === "goals" && (
        <Modal
          title="Edit Target"
          onClose={() => setEditing(null)}
        >
          <EditGoalForm
            item={editing.item}
            onSubmit={updateGoal}
            onCancel={() => setEditing(null)}
            saving={goalSaving}
          />
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  type,
}) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>

        <strong>
          {formatRupiah(value)}
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
}) {
  return (
    <button
      className="action-button"
      onClick={onClick}
    >
      <div className="action-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>

        <span>{subtitle}</span>
      </div>

      <Plus size={19} />
    </button>
  );
}

/* =========================================================
   TRANSACTION SECTION
========================================================= */

function TransactionSection({
  title,
  icon,
  items,
  type,
  emptyText,
  onEdit,
  onDelete,
  saving = false,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-title">
          {icon}
          <h3>{title}</h3>
        </div>

        <span className="count-badge">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="transaction-list">
          {items.map((item) => {
            const displayAmount =
              type === "debts"
                ? item.remaining
                : type === "goals"
                ? item.saved
                : item.amount;

            return (
              <div
                className="transaction-item"
                key={item.id}
              >
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

                  {item.transaction_date &&
                    type === "goals" && (
                      <span className="transaction-date">
                        Target:{" "}
                        {item.target_date}
                      </span>
                    )}

                  {type === "debts" && (
                    <span className="transaction-date">
                      Total:{" "}
                      {formatRupiah(
                        item.amount
                      )}
                    </span>
                  )}

                  {type === "goals" && (
                    <span className="transaction-date">
                      Target:{" "}
                      {formatRupiah(
                        item.target
                      )}
                    </span>
                  )}
                </div>

                <div className="transaction-right">
                  <strong>
                    {formatRupiah(
                      displayAmount
                    )}
                  </strong>

                  <div className="item-actions">
                    <button
                      onClick={() =>
                        onEdit(type, item)
                      }
                      title="Edit"
                      disabled={saving}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() =>
                        onDelete(item.id)
                      }
                      title="Hapus"
                      disabled={saving}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  onClose,
  children,
}) {
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
   FORM ACTIONS
========================================================= */

function FormActions({
  onCancel,
  saving = false,
}) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="cancel-button"
        onClick={onCancel}
        disabled={saving}
      >
        Batal
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2
              size={16}
              className="spin"
            />
            Menyimpan...
          </>
        ) : (
          "Simpan"
        )}
      </button>
    </div>
  );
}

/* =========================================================
   INCOME FORM
========================================================= */

function IncomeForm({
  onSubmit,
  onCancel,
  saving,
}) {
  const [owner, setOwner] =
    useState("Ahmed");

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [date, setDate] =
    useState(getToday());

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount) return;

    onSubmit({
      owner,
      amount: Number(amount),
      description,
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Pemasukan untuk</label>

      <select
        value={owner}
        onChange={(e) =>
          setOwner(e.target.value)
        }
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
        onChange={(e) =>
          setAmount(e.target.value)
        }
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
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   EDIT INCOME
========================================================= */

function EditIncomeForm({
  item,
  onSubmit,
  onCancel,
  saving,
}) {
  const [owner, setOwner] =
    useState(item.owner || "Ahmed");

  const [amount, setAmount] =
    useState(item.amount ?? "");

  const [description, setDescription] =
    useState(item.description || "");

  const [date, setDate] =
    useState(
      item.transaction_date ||
        item.date ||
        getToday()
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount) return;

    onSubmit({
      ...item,
      owner,
      amount: Number(amount),
      description,
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Pemasukan untuk</label>

      <select
        value={owner}
        onChange={(e) =>
          setOwner(e.target.value)
        }
      >
        <option>Ahmed</option>
        <option>Nia</option>
        <option>Lainnya</option>
      </select>

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
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
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   EXPENSE FORM
========================================================= */

function ExpenseForm({
  onSubmit,
  onCancel,
  saving,
}) {
  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [date, setDate] =
    useState(getToday());

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount) return;

    onSubmit({
      name,
      amount: Number(amount),
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Keterangan</label>

      <input
        type="text"
        placeholder="Contoh: Makan"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
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
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   EDIT EXPENSE
========================================================= */

function EditExpenseForm({
  item,
  onSubmit,
  onCancel,
  saving,
}) {
  const [name, setName] =
    useState(item.name || "");

  const [amount, setAmount] =
    useState(item.amount ?? "");

  const [date, setDate] =
    useState(
      item.transaction_date ||
        item.date ||
        getToday()
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount) return;

    onSubmit({
      ...item,
      name,
      amount: Number(amount),
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Keterangan</label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(e.target.value)
        }
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   DEBT FORM
========================================================= */

function DebtForm({
  onSubmit,
  onCancel,
  saving,
}) {
  const [name, setName] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [remaining, setRemaining] =
    useState("");

  const [date, setDate] =
    useState(getToday());

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount || remaining === "") {
      return;
    }

    onSubmit({
      name,
      amount: Number(amount),
      remaining: Number(remaining),
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Nama Cicilan</label>

      <input
        type="text"
        placeholder="Contoh: Motor"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <label>Total Cicilan</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 20000000"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
      />

      <label>Sisa Cicilan</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 15000000"
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
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   EDIT DEBT
========================================================= */

function EditDebtForm({
  item,
  onSubmit,
  onCancel,
  saving,
}) {
  const [name, setName] =
    useState(item.name || "");

  const [amount, setAmount] =
    useState(item.amount ?? "");

  const [remaining, setRemaining] =
    useState(item.remaining ?? "");

  const [date, setDate] =
    useState(
      item.transaction_date ||
        item.date ||
        getToday()
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !name ||
      !amount ||
      remaining === ""
    ) {
      return;
    }

    onSubmit({
      ...item,
      name,
      amount: Number(amount),
      remaining: Number(remaining),
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Nama Cicilan</label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <label>Total Cicilan</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
      />

      <label>Sisa Cicilan</label>

      <input
        type="number"
        min="0"
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
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   GOAL FORM
========================================================= */

function GoalForm({
  onSubmit,
  onCancel,
  saving,
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
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Nama Target</label>

      <input
        type="text"
        placeholder="Contoh: Dana Nikah"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

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
        value={targetDate}
        onChange={(e) =>
          setTargetDate(e.target.value)
        }
      />

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}

/* =========================================================
   EDIT GOAL
========================================================= */

function EditGoalForm({
  item,
  onSubmit,
  onCancel,
  saving,
}) {
  const [name, setName] =
    useState(item.name || "");

  const [target, setTarget] =
    useState(item.target ?? "");

  const [saved, setSaved] =
    useState(item.saved ?? "");

  const [monthly, setMonthly] =
    useState(item.monthly ?? "");

  const [date, setDate] =
    useState(item.target_date || "");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !target) return;

    onSubmit({
      ...item,
      name,
      target: Number(target),
      saved: Number(saved || 0),
      monthly: Number(monthly || 0),
      target_date: date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>Nama Target</label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

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

      <FormActions
        onCancel={onCancel}
        saving={saving}
      />
    </form>
  );
}
