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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
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
                onChange={(e) =>
                  setPassword(e.target.value)
                }
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
                <Loader2
                  size={18}
                  className="spin"
                />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <div className="login-info">
          Gunakan akun Ahmed atau Nia yang sudah
          dibuat di Supabase.
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

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [loadingHousehold, setLoadingHousehold] =
    useState(false);

  const [authError, setAuthError] =
    useState("");

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
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadHousehold(session.user.id);
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
      console.error(
        "Gagal mengambil household:",
        error
      );

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
        <Loader2
          size={30}
          className="spin"
        />

        <p>Memeriksa sesi...</p>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <LoginScreen onLogin={setUser} />
    );
  }

  if (loadingHousehold) {
    return (
      <div className="loading-page">
        <Loader2
          size={30}
          className="spin"
        />

        <p>Menghubungkan ke household...</p>
      </div>
    );
  }

  if (authError || !household) {
    return (
      <div className="loading-page">
        <div className="access-card">
          <Wallet size={34} />

          <h2>
            Akses Household Bermasalah
          </h2>

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

function Dashboard({
  user,
  household,
  onLogout,
}) {
  const [data, setData] = useState(() => {
    try {
      const savedData =
        localStorage.getItem(
          "nabung-bersama-data"
        );

      if (savedData) {
        const parsed = JSON.parse(
          savedData
        );

        return {
          income: [],
          expenses: [],
          debts: [],
          goals: parsed.goals || [],
        };
      }
    } catch (error) {
      console.error(
        "Gagal membaca localStorage:",
        error
      );
    }

    return { ...initialData };
  });

  const [incomeLoading, setIncomeLoading] =
    useState(true);

  const [expenseLoading, setExpenseLoading] =
    useState(true);

  const [debtLoading, setDebtLoading] =
    useState(true);

  const [incomeError, setIncomeError] =
    useState("");

  const [expenseError, setExpenseError] =
    useState("");

  const [debtError, setDebtError] =
    useState("");

  const [incomeSaving, setIncomeSaving] =
    useState(false);

  const [expenseSaving, setExpenseSaving] =
    useState(false);

  const [debtSaving, setDebtSaving] =
    useState(false);

  const [period, setPeriod] =
    useState("all");

  const [showIncome, setShowIncome] =
    useState(false);

  const [showExpense, setShowExpense] =
    useState(false);

  const [showDebt, setShowDebt] =
    useState(false);

  const [showGoal, setShowGoal] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  /* =======================================================
     LOAD INCOME
  ======================================================= */

  const loadIncome = async () => {
    setIncomeLoading(true);
    setIncomeError("");

    const {
      data: incomeData,
      error,
    } = await supabase
      .from("income")
      .select(
        "id, owner, description, amount, transaction_date, created_at, household_id"
      )
      .eq(
        "household_id",
        HOUSEHOLD_ID
      )
      .order("transaction_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Gagal mengambil income:",
        error
      );

      setIncomeError(
        `Pemasukan belum dapat dimuat: ${error.message}`
      );

      setIncomeLoading(false);
      return;
    }

    const formattedIncome =
      (incomeData || []).map((item) => ({
        id: item.id,
        owner: item.owner,
        description: item.description,
        amount: Number(
          item.amount || 0
        ),
        date: item.transaction_date,
        transaction_date:
          item.transaction_date,
        created_at: item.created_at,
        household_id:
          item.household_id,
      }));

    setData((prev) => ({
      ...prev,
      income: formattedIncome,
    }));

    setIncomeLoading(false);
  };

  /* =======================================================
     LOAD EXPENSES
  ======================================================= */

  const loadExpenses = async () => {
    setExpenseLoading(true);
    setExpenseError("");

    const {
      data: expenseData,
      error,
    } = await supabase
      .from("expenses")
      .select(
        "id, name, amount, transaction_date, created_at, household_id"
      )
      .eq(
        "household_id",
        HOUSEHOLD_ID
      )
      .order("transaction_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Gagal mengambil expenses:",
        error
      );

      setExpenseError(
        `Pengeluaran belum dapat dimuat: ${error.message}`
      );

      setExpenseLoading(false);
      return;
    }

    const formattedExpenses =
      (expenseData || []).map(
        (item) => {
          const date =
            item.transaction_date
              ? new Date(
                  `${item.transaction_date}T00:00:00`
                )
              : null;

          return {
            id: item.id,
            name: item.name,
            amount: Number(
              item.amount || 0
            ),
            date:
              item.transaction_date,
            transaction_date:
              item.transaction_date,
            year: date
              ? date.getFullYear()
              : null,
            month: date
              ? date.getMonth() + 1
              : null,
            created_at:
              item.created_at,
            household_id:
              item.household_id,
          };
        }
      );

    setData((prev) => ({
      ...prev,
      expenses: formattedExpenses,
    }));

    setExpenseLoading(false);
  };

  /* =======================================================
     LOAD DEBTS
  ======================================================= */

  const loadDebts = async () => {
    setDebtLoading(true);
    setDebtError("");

    const {
      data: debtData,
      error,
    } = await supabase
      .from("debts")
      .select(
        "id, name, amount, remaining, transaction_date, created_at, household_id"
      )
      .eq(
        "household_id",
        HOUSEHOLD_ID
      )
      .order("transaction_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Gagal mengambil debts:",
        error
      );

      setDebtError(
        `Cicilan belum dapat dimuat: ${error.message}`
      );

      setDebtLoading(false);
      return;
    }

    const formattedDebts =
      (debtData || []).map(
        (item) => {
          const date =
            item.transaction_date
              ? new Date(
                  `${item.transaction_date}T00:00:00`
                )
              : null;

          return {
            id: item.id,
            name: item.name,
            amount: Number(
              item.amount || 0
            ),
            remaining: Number(
              item.remaining || 0
            ),
            date:
              item.transaction_date,
            transaction_date:
              item.transaction_date,
            year: date
              ? date.getFullYear()
              : null,
            month: date
              ? date.getMonth() + 1
              : null,
            created_at:
              item.created_at,
            household_id:
              item.household_id,
          };
        }
      );

    setData((prev) => ({
      ...prev,
      debts: formattedDebts,
    }));

    setDebtLoading(false);
  };

  useEffect(() => {
    loadIncome();
    loadExpenses();
    loadDebts();
  }, []);

  /* =======================================================
     LOCAL STORAGE
     HANYA UNTUK TARGET SEMENTARA
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "nabung-bersama-data",
      JSON.stringify({
        goals: data.goals,
      })
    );
  }, [data.goals]);

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeForms = () => {
    setShowIncome(false);
    setShowExpense(false);
    setShowDebt(false);
    setShowGoal(false);
    setEditing(null);
  };

  /* =======================================================
     ADD INCOME
  ======================================================= */

  const addIncome = async (item) => {
    setIncomeSaving(true);
    setIncomeError("");

    const {
      data: insertedIncome,
      error,
    } = await supabase
      .from("income")
      .insert({
        owner: item.owner,
        description:
          item.description || null,
        amount: Number(
          item.amount
        ),
        transaction_date: item.date,
        household_id:
          HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Gagal menyimpan income:",
        error
      );

      setIncomeError(
        `Gagal menyimpan pemasukan: ${error.message}`
      );

      setIncomeSaving(false);
      return;
    }

    const newIncome = {
      id: insertedIncome.id,
      owner:
        insertedIncome.owner,
      description:
        insertedIncome.description,
      amount: Number(
        insertedIncome.amount || 0
      ),
      date:
        insertedIncome.transaction_date,
      transaction_date:
        insertedIncome.transaction_date,
      created_at:
        insertedIncome.created_at,
      household_id:
        insertedIncome.household_id,
    };

    setData((prev) => ({
      ...prev,
      income: [
        newIncome,
        ...prev.income,
      ],
    }));

    setIncomeSaving(false);
    closeForms();
  };

  /* =======================================================
     UPDATE INCOME
  ======================================================= */

  const updateIncome = async (item) => {
    setIncomeSaving(true);
    setIncomeError("");

    const {
      data: updatedIncome,
      error,
    } = await supabase
      .from("income")
      .update({
        owner: item.owner,
        description:
          item.description || null,
        amount: Number(
          item.amount
        ),
        transaction_date:
          item.date,
      })
      .eq("id", item.id)
      .eq(
        "household_id",
        HOUSEHOLD_ID
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Gagal update income:",
        error
      );

      setIncomeError(
        `Gagal mengubah pemasukan: ${error.message}`
      );

      setIncomeSaving(false);
      return;
    }

    const updatedItem = {
      id: updatedIncome.id,
      owner:
        updatedIncome.owner,
      description:
        updatedIncome.description,
      amount: Number(
        updatedIncome.amount || 0
      ),
      date:
        updatedIncome.transaction_date,
      transaction_date:
        updatedIncome.transaction_date,
      created_at:
        updatedIncome.created_at,
      household_id:
        updatedIncome.household_id,
    };

    setData((prev) => ({
      ...prev,
      income: prev.income.map(
        (currentItem) =>
          currentItem.id ===
          updatedItem.id
            ? updatedItem
            : currentItem
      ),
    }));

    setIncomeSaving(false);
    setEditing(null);
  };

  /* =======================================================
     DELETE INCOME
  ======================================================= */

  const deleteIncome = async (id) => {
    if (
      !window.confirm(
        "Hapus pemasukan ini?"
      )
    ) {
      return;
    }

    setIncomeSaving(true);
    setIncomeError("");

    const { error } = await supabase
      .from("income")
      .delete()
      .eq("id", id)
      .eq(
        "household_id",
        HOUSEHOLD_ID
      );

    if (error) {
      console.error(
        "Gagal menghapus income:",
        error
      );

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
     ADD EXPENSE
  ======================================================= */

  const addExpense = async (item) => {
    setExpenseSaving(true);
    setExpenseError("");

    const {
      data: insertedExpense,
      error,
    } = await supabase
      .from("expenses")
      .insert({
        name: item.name,
        amount: Number(
          item.amount
        ),
        transaction_date:
          item.date,
        household_id:
          HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Gagal menyimpan expense:",
        error
      );

      setExpenseError(
        `Gagal menyimpan pengeluaran: ${error.message}`
      );

      setExpenseSaving(false);
      return;
    }

    const expenseDate =
      insertedExpense.transaction_date
        ? new Date(
            `${insertedExpense.transaction_date}T00:00:00`
          )
        : null;

    const newExpense = {
      id: insertedExpense.id,
      name:
        insertedExpense.name,
      amount: Number(
        insertedExpense.amount || 0
      ),
      date:
        insertedExpense.transaction_date,
      transaction_date:
        insertedExpense.transaction_date,
      year: expenseDate
        ? expenseDate.getFullYear()
        : null,
      month: expenseDate
        ? expenseDate.getMonth() + 1
        : null,
      created_at:
        insertedExpense.created_at,
      household_id:
        insertedExpense.household_id,
    };

    setData((prev) => ({
      ...prev,
      expenses: [
        newExpense,
        ...prev.expenses,
      ],
    }));

    setExpenseSaving(false);
    closeForms();
  };

  /* =======================================================
     UPDATE EXPENSE
  ======================================================= */

  const updateExpense = async (item) => {
    setExpenseSaving(true);
    setExpenseError("");

    const {
      data: updatedExpense,
      error,
    } = await supabase
      .from("expenses")
      .update({
        name: item.name,
        amount: Number(
          item.amount
        ),
        transaction_date:
          item.date,
      })
      .eq("id", item.id)
      .eq(
        "household_id",
        HOUSEHOLD_ID
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Gagal update expense:",
        error
      );

      setExpenseError(
        `Gagal mengubah pengeluaran: ${error.message}`
      );

      setExpenseSaving(false);
      return;
    }

    const expenseDate =
      updatedExpense.transaction_date
        ? new Date(
            `${updatedExpense.transaction_date}T00:00:00`
          )
        : null;

    const updatedItem = {
      id: updatedExpense.id,
      name:
        updatedExpense.name,
      amount: Number(
        updatedExpense.amount || 0
      ),
      date:
        updatedExpense.transaction_date,
      transaction_date:
        updatedExpense.transaction_date,
      year: expenseDate
        ? expenseDate.getFullYear()
        : null,
      month: expenseDate
        ? expenseDate.getMonth() + 1
        : null,
      created_at:
        updatedExpense.created_at,
      household_id:
        updatedExpense.household_id,
    };

    setData((prev) => ({
      ...prev,
      expenses:
        prev.expenses.map(
          (currentItem) =>
            currentItem.id ===
            updatedItem.id
              ? updatedItem
              : currentItem
        ),
    }));

    setExpenseSaving(false);
    setEditing(null);
  };

  /* =======================================================
     DELETE EXPENSE
  ======================================================= */

  const deleteExpense = async (id) => {
    if (
      !window.confirm(
        "Hapus pengeluaran ini?"
      )
    ) {
      return;
    }

    setExpenseSaving(true);
    setExpenseError("");

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq(
        "household_id",
        HOUSEHOLD_ID
      );

    if (error) {
      console.error(
        "Gagal menghapus expense:",
        error
      );

      setExpenseError(
        `Gagal menghapus pengeluaran: ${error.message}`
      );

      setExpenseSaving(false);
      return;
    }

    setData((prev) => ({
      ...prev,
      expenses:
        prev.expenses.filter(
          (item) => item.id !== id
        ),
    }));

    setExpenseSaving(false);
  };

  /* =======================================================
     ADD DEBT → SUPABASE
  ======================================================= */

  const addDebt = async (item) => {
    setDebtSaving(true);
    setDebtError("");

    const {
      data: insertedDebt,
      error,
    } = await supabase
      .from("debts")
      .insert({
        name: item.name,
        amount: Number(
          item.amount
        ),
        remaining: Number(
          item.remaining
        ),
        transaction_date:
          item.date,
        household_id:
          HOUSEHOLD_ID,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Gagal menyimpan debt:",
        error
      );

      setDebtError(
        `Gagal menyimpan cicilan: ${error.message}`
      );

      setDebtSaving(false);
      return;
    }

    const debtDate =
      insertedDebt.transaction_date
        ? new Date(
            `${insertedDebt.transaction_date}T00:00:00`
          )
        : null;

    const newDebt = {
      id: insertedDebt.id,
      name:
        insertedDebt.name,
      amount: Number(
        insertedDebt.amount || 0
      ),
      remaining: Number(
        insertedDebt.remaining || 0
      ),
      date:
        insertedDebt.transaction_date,
      transaction_date:
        insertedDebt.transaction_date,
      year: debtDate
        ? debtDate.getFullYear()
        : null,
      month: debtDate
        ? debtDate.getMonth() + 1
        : null,
      created_at:
        insertedDebt.created_at,
      household_id:
        insertedDebt.household_id,
    };

    setData((prev) => ({
      ...prev,
      debts: [
        newDebt,
        ...prev.debts,
      ],
    }));

    setDebtSaving(false);
    closeForms();
  };

  /* =======================================================
     UPDATE DEBT → SUPABASE
  ======================================================= */

  const updateDebt = async (item) => {
    setDebtSaving(true);
    setDebtError("");

    const {
      data: updatedDebt,
      error,
    } = await supabase
      .from("debts")
      .update({
        name: item.name,
        amount: Number(
          item.amount
        ),
        remaining: Number(
          item.remaining
        ),
        transaction_date:
          item.date,
      })
      .eq("id", item.id)
      .eq(
        "household_id",
        HOUSEHOLD_ID
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Gagal update debt:",
        error
      );

      setDebtError(
        `Gagal mengubah cicilan: ${error.message}`
      );

      setDebtSaving(false);
      return;
    }

    const debtDate =
      updatedDebt.transaction_date
        ? new Date(
            `${updatedDebt.transaction_date}T00:00:00`
          )
        : null;

    const updatedItem = {
      id: updatedDebt.id,
      name:
        updatedDebt.name,
      amount: Number(
        updatedDebt.amount || 0
      ),
      remaining: Number(
        updatedDebt.remaining || 0
      ),
      date:
        updatedDebt.transaction_date,
      transaction_date:
        updatedDebt.transaction_date,
      year: debtDate
        ? debtDate.getFullYear()
        : null,
      month: debtDate
        ? debtDate.getMonth() + 1
        : null,
      created_at:
        updatedDebt.created_at,
      household_id:
        updatedDebt.household_id,
    };

    setData((prev) => ({
      ...prev,
      debts: prev.debts.map(
        (currentItem) =>
          currentItem.id ===
          updatedItem.id
            ? updatedItem
            : currentItem
      ),
    }));

    setDebtSaving(false);
    setEditing(null);
  };

  /* =======================================================
     DELETE DEBT → SUPABASE
  ======================================================= */

  const deleteDebt = async (id) => {
    if (
      !window.confirm(
        "Hapus cicilan ini?"
      )
    ) {
      return;
    }

    setDebtSaving(true);
    setDebtError("");

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("id", id)
      .eq(
        "household_id",
        HOUSEHOLD_ID
      );

    if (error) {
      console.error(
        "Gagal menghapus debt:",
        error
      );

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
     GOAL — LOCAL STORAGE SEMENTARA
  ======================================================= */

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

  const deleteLocalGoal = (id) => {
    if (
      !window.confirm(
        "Hapus target ini?"
      )
    ) {
      return;
    }

    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter(
        (item) => item.id !== id
      ),
    }));
  };

  const startEdit = (type, item) => {
    setEditing({
      type,
      item,
    });
  };

  const updateLocalGoal = (
    updatedItem
  ) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map(
        (currentItem) =>
          currentItem.id ===
          updatedItem.id
            ? updatedItem
            : currentItem
      ),
    }));

    setEditing(null);
  };

  /* =======================================================
     FILTER INCOME
  ======================================================= */

  const filteredIncome = useMemo(() => {
    if (period === "all") {
      return data.income;
    }

    const now = new Date();

    const currentYear =
      now.getFullYear();

    const currentMonth =
      now.getMonth() + 1;

    return data.income.filter(
      (item) => {
        if (!item.transaction_date) {
          return false;
        }

        const date = new Date(
          `${item.transaction_date}T00:00:00`
        );

        const year =
          date.getFullYear();

        const month =
          date.getMonth() + 1;

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
      }
    );
  }, [data.income, period]);

  /* =======================================================
     FILTER EXPENSE
  ======================================================= */

  const filteredExpenses =
    useMemo(() => {
      if (period === "all") {
        return data.expenses;
      }

      const now = new Date();

      const currentYear =
        now.getFullYear();

      const currentMonth =
        now.getMonth() + 1;

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

          const year =
            date.getFullYear();

          const month =
            date.getMonth() + 1;

          if (period === "year") {
            return (
              year === currentYear
            );
          }

          if (period === "month") {
            return (
              year === currentYear &&
              month === currentMonth
            );
          }

          return true;
        }
      );
    }, [data.expenses, period]);

  /* =======================================================
     FILTER DEBT
  ======================================================= */

  const filteredDebts = useMemo(() => {
    if (period === "all") {
      return data.debts;
    }

    const now = new Date();

    const currentYear =
      now.getFullYear();

    const currentMonth =
      now.getMonth() + 1;

    return data.debts.filter(
      (item) => {
        if (!item.transaction_date) {
          return false;
        }

        const date = new Date(
          `${item.transaction_date}T00:00:00`
        );

        const year =
          date.getFullYear();

        const month =
          date.getMonth() + 1;

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
      }
    );
  }, [data.debts, period]);

  /* =======================================================
     GOAL FILTER
  ======================================================= */

  const filteredGoals =
    data.goals;

  /* =======================================================
     TOTAL
  ======================================================= */

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
    filteredGoals.reduce(
      (sum, item) =>
        sum +
        Number(item.saved || 0),
      0
    );

  const totalDebtRemaining =
    filteredDebts.reduce(
      (sum, item) =>
        sum +
        Number(
          item.remaining || 0
        ),
      0
    );

  const remaining =
    totalIncome -
    totalExpenses;

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
            <h1>
              Nabung Bersama
            </h1>

            <span>
              {household.name}
            </span>
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

            <span>
              Logout
            </span>
          </button>
        </div>
      </header>

      <main className="container">
        <section className="welcome-section">
          <div>
            <h2>
              Keuangan Bersama
            </h2>

            <p>
              Kelola pemasukan,
              pengeluaran, cicilan,
              dan target tabungan
              bersama.
            </p>
          </div>

          <div className="period-filter">
            <button
              className={
                period === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod("all")
              }
            >
              Semua
            </button>

            <button
              className={
                period === "year"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod("year")
              }
            >
              Tahun
            </button>

            <button
              className={
                period === "month"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod("month")
              }
            >
              Bulan
            </button>
          </div>
        </section>

        {incomeError && (
          <div
            className="login-error"
            style={{
              marginBottom: "10px",
            }}
          >
            {incomeError}
          </div>
        )}

        {expenseError && (
          <div
            className="login-error"
            style={{
              marginBottom: "10px",
            }}
          >
            {expenseError}
          </div>
        )}

        {debtError && (
          <div
            className="login-error"
            style={{
              marginBottom: "10px",
            }}
          >
            {debtError}
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            icon={
              <ArrowUpCircle />
            }
            title="Total Pemasukan"
            value={totalIncome}
            type="income"
          />

          <StatCard
            icon={
              <ArrowDownCircle />
            }
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
            icon={
              <ArrowUpCircle />
            }
            title="Pemasukan"
            subtitle="Tambah pemasukan"
            onClick={() =>
              setShowIncome(true)
            }
          />

          <ActionButton
            icon={
              <ArrowDownCircle />
            }
            title="Pengeluaran"
            subtitle="Tambah pengeluaran"
            onClick={() =>
              setShowExpense(true)
            }
          />

          <ActionButton
            icon={<CreditCard />}
            title="Cicilan"
            subtitle="Kelola cicilan"
            onClick={() =>
              setShowDebt(true)
            }
          />

          <ActionButton
            icon={<Target />}
            title="Target"
            subtitle="Target tabungan"
            onClick={() =>
              setShowGoal(true)
            }
          />
        </section>

        <section className="content-grid">
          <TransactionSection
            title="Pemasukan"
            icon={
              <ArrowUpCircle />
            }
            items={filteredIncome}
            type="income"
            emptyText={
              incomeLoading
                ? "Memuat pemasukan..."
                : "Belum ada pemasukan."
            }
            onEdit={startEdit}
            onDelete={
              deleteIncome
            }
            saving={incomeSaving}
          />

          <TransactionSection
            title="Pengeluaran"
            icon={
              <ArrowDownCircle />
            }
            items={filteredExpenses}
            type="expenses"
            emptyText={
              expenseLoading
                ? "Memuat pengeluaran..."
                : "Belum ada pengeluaran."
            }
            onEdit={startEdit}
            onDelete={
              deleteExpense
            }
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
            emptyText="Belum ada target."
            onEdit={startEdit}
            onDelete={
              deleteLocalGoal
            }
          />
        </section>

        {filteredDebts.length >
          0 && (
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
              {formatRupiah(
                totalDebtRemaining
              )}
            </strong>
          </div>
        )}
      </main>

      {/* ===================================================
          TAMBAH PEMASUKAN
      =================================================== */}

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

      {/* ===================================================
          TAMBAH PENGELUARAN
      =================================================== */}

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

      {/* ===================================================
          TAMBAH CICILAN
      =================================================== */}

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

      {/* ===================================================
          TAMBAH TARGET
      =================================================== */}

      {showGoal && (
        <Modal
          title="Tambah Target Tabungan"
          onClose={closeForms}
        >
          <GoalForm
            onSubmit={addGoal}
            onCancel={closeForms}
          />
        </Modal>
      )}

      {/* ===================================================
          EDIT PEMASUKAN
      =================================================== */}

      {editing?.type ===
        "income" && (
        <Modal
          title="Edit Pemasukan"
          onClose={() =>
            setEditing(null)
          }
        >
          <EditIncomeForm
            item={editing.item}
            onSubmit={updateIncome}
            onCancel={() =>
              setEditing(null)
            }
            saving={incomeSaving}
          />
        </Modal>
      )}

      {/* ===================================================
          EDIT PENGELUARAN
      =================================================== */}

      {editing?.type ===
        "expenses" && (
        <Modal
          title="Edit Pengeluaran"
          onClose={() =>
            setEditing(null)
          }
        >
          <EditExpenseForm
            item={editing.item}
            onSubmit={updateExpense}
            onCancel={() =>
              setEditing(null)
            }
            saving={expenseSaving}
          />
        </Modal>
      )}

      {/* ===================================================
          EDIT CICILAN
      =================================================== */}

      {editing?.type ===
        "debts" && (
        <Modal
          title="Edit Cicilan"
          onClose={() =>
            setEditing(null)
          }
        >
          <EditDebtForm
            item={editing.item}
            onSubmit={updateDebt}
            onCancel={() =>
              setEditing(null)
            }
            saving={debtSaving}
          />
        </Modal>
      )}

      {/* ===================================================
          EDIT TARGET
      =================================================== */}

      {editing?.type ===
        "goals" && (
        <Modal
          title="Edit Target"
          onClose={() =>
            setEditing(null)
          }
        >
          <EditGoalForm
            item={editing.item}
            onSubmit={
              updateLocalGoal
            }
            onCancel={() =>
              setEditing(null)
            }
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
    <div
      className={`stat-card ${type}`}
    >
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

        <span>
          {subtitle}
        </span>
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
          <p>
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="transaction-list">
          {items.map((item) => (
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

                {type ===
                  "debts" && (
                  <span className="transaction-date">
                    Sisa:{" "}
                    {formatRupiah(
                      item.remaining
                    )}
                  </span>
                )}
              </div>

              <div className="transaction-right">
                <strong>
                  {formatRupiah(
                    type === "debts"
                      ? item.remaining
                      : item.amount ??
                          item.saved ??
                          item.target
                  )}
                </strong>

                <div className="item-actions">
                  <button
                    onClick={() =>
                      onEdit(
                        type,
                        item
                      )
                    }
                    title="Edit"
                    disabled={saving}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() =>
                      onDelete(
                        type,
                        item.id
                      )
                    }
                    title="Hapus"
                    disabled={saving}
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

          <button
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
   FORM PEMASUKAN
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

    if (!amount) {
      return;
    }

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
      <label>
        Pemasukan untuk
      </label>

      <select
        value={owner}
        onChange={(e) =>
          setOwner(e.target.value)
        }
      >
        <option>Ahmed</option>
        <option>Nia</option>
        <option>
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
          setAmount(
            e.target.value
          )
        }
      />

      <label>
        Keterangan
      </label>

      <input
        type="text"
        placeholder="Contoh: Gaji"
        value={description}
        onChange={(e) =>
          setDescription(
            e.target.value
          )
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
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
   EDIT PEMASUKAN
========================================================= */

function EditIncomeForm({
  item,
  onSubmit,
  onCancel,
  saving,
}) {
  const [owner, setOwner] =
    useState(
      item.owner || "Ahmed"
    );

  const [amount, setAmount] =
    useState(
      item.amount ?? ""
    );

  const [description, setDescription] =
    useState(
      item.description || ""
    );

  const [date, setDate] =
    useState(
      item.transaction_date ||
        item.date ||
        getToday()
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount) {
      return;
    }

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
      <label>
        Pemasukan untuk
      </label>

      <select
        value={owner}
        onChange={(e) =>
          setOwner(
            e.target.value
          )
        }
      >
        <option>Ahmed</option>
        <option>Nia</option>
        <option>
          Lainnya
        </option>
      </select>

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
      />

      <label>
        Keterangan
      </label>

      <input
        type="text"
        value={description}
        onChange={(e) =>
          setDescription(
            e.target.value
          )
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
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
   FORM PENGELUARAN
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

    if (!name || !amount) {
      return;
    }

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
      <label>
        Keterangan
      </label>

      <input
        type="text"
        placeholder="Contoh: Makan"
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
      />

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 100000"
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
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
   EDIT PENGELUARAN
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
    useState(
      item.amount ?? ""
    );

  const [date, setDate] =
    useState(
      item.transaction_date ||
        item.date ||
        getToday()
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount) {
      return;
    }

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
      <label>
        Keterangan
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
      />

      <label>Nominal</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
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
   FORM CICILAN
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

    if (
      !name ||
      !amount ||
      !remaining
    ) {
      return;
    }

    onSubmit({
      name,
      amount: Number(amount),
      remaining:
        Number(remaining),
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>
        Nama Cicilan
      </label>

      <input
        type="text"
        placeholder="Contoh: Motor"
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
      />

      <label>
        Total Cicilan
      </label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 20000000"
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
      />

      <label>
        Sisa Cicilan
      </label>

      <input
        type="number"
        min="0"
        placeholder="Contoh: 15000000"
        value={remaining}
        onChange={(e) =>
          setRemaining(
            e.target.value
          )
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
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
   EDIT CICILAN
========================================================= */

function EditDebtForm({
  item,
  onSubmit,
  onCancel,
  saving,
}) {
  const [name, setName] =
    useState(
      item.name || ""
    );

  const [amount, setAmount] =
    useState(
      item.amount ?? ""
    );

  const [remaining, setRemaining] =
    useState(
      item.remaining ?? ""
    );

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
      remaining:
        Number(remaining),
      date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>
        Nama Cicilan
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
      />

      <label>
        Total Cicilan
      </label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) =>
          setAmount(
            e.target.value
          )
        }
      />

      <label>
        Sisa Cicilan
      </label>

      <input
        type="number"
        min="0"
        value={remaining}
        onChange={(e) =>
          setRemaining(
            e.target.value
          )
        }
      />

      <label>Tanggal</label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
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
   FORM TARGET
========================================================= */

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !target) {
      return;
    }

    onSubmit({
      name,
      target: Number(target),
      saved: Number(
        saved || 0
      ),
      monthly: Number(
        monthly || 0
      ),
      target_date:
        targetDate,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>
        Nama Target
      </label>

      <input
        type="text"
        placeholder="Contoh: Dana Nikah"
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
      />

      <label>Target</label>

      <input
        type="number"
        min="0"
        value={target}
        onChange={(e) =>
          setTarget(
            e.target.value
          )
        }
      />

      <label>
        Sudah Terkumpul
      </label>

      <input
        type="number"
        min="0"
        value={saved}
        onChange={(e) =>
          setSaved(
            e.target.value
          )
        }
      />

      <label>
        Tabungan per Bulan
      </label>

      <input
        type="number"
        min="0"
        value={monthly}
        onChange={(e) =>
          setMonthly(
            e.target.value
          )
        }
      />

      <label>
        Target Tanggal
      </label>

      <input
        type="date"
        value={targetDate}
        onChange={(e) =>
          setTargetDate(
            e.target.value
          )
        }
      />

      <FormActions
        onCancel={onCancel}
      />
    </form>
  );
}

/* =========================================================
   EDIT TARGET
========================================================= */

function EditGoalForm({
  item,
  onSubmit,
  onCancel,
}) {
  const [name, setName] =
    useState(
      item.name || ""
    );

  const [target, setTarget] =
    useState(
      item.target ?? ""
    );

  const [saved, setSaved] =
    useState(
      item.saved ?? ""
    );

  const [monthly, setMonthly] =
    useState(
      item.monthly ?? ""
    );

  const [date, setDate] =
    useState(
      item.target_date || ""
    );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !target) {
      return;
    }

    onSubmit({
      ...item,
      name,
      target: Number(target),
      saved: Number(saved),
      monthly: Number(monthly),
      target_date: date,
    });
  };

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
    >
      <label>
        Nama Target
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(
            e.target.value
          )
        }
      />

      <label>Target</label>

      <input
        type="number"
        min="0"
        value={target}
        onChange={(e) =>
          setTarget(
            e.target.value
          )
        }
      />

      <label>
        Sudah Terkumpul
      </label>

      <input
        type="number"
        min="0"
        value={saved}
        onChange={(e) =>
          setSaved(
            e.target.value
          )
        }
      />

      <label>
        Tabungan per Bulan
      </label>

      <input
        type="number"
        min="0"
        value={monthly}
        onChange={(e) =>
          setMonthly(
            e.target.value
          )
        }
      />

      <label>
        Target Tanggal
      </label>

      <input
        type="date"
        value={date}
        onChange={(e) =>
          setDate(
            e.target.value
          )
        }
      />

      <FormActions
        onCancel={onCancel}
      />
    </form>
  );
}
