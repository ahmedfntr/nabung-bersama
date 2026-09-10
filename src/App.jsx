import { useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  Trash2,
  Target,
  CreditCard,
  Home,
  TrendingUp,
  CalendarDays,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CircleDollarSign,
} from "lucide-react";

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const initialData = {
  income: [],
  expenses: [],
  debts: [],
  goals: [],
};

function App() {
  const [period, setPeriod] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [data, setData] = useState({
    ...initialData,
  });

  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showDebt, setShowDebt] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    owner: "Ahmed",
    description: "",
    amount: "",
    date: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    date: "",
  });

  const [debtForm, setDebtForm] = useState({
    name: "",
    amount: "",
    remaining: "",
  });

  const [goalForm, setGoalForm] = useState({
    name: "",
    target: "",
    saved: "",
    monthly: "",
  });

  const availableYears = useMemo(() => {
    const years = new Set([2026]);

    [
      ...data.income,
      ...data.expenses,
      ...data.debts,
      ...data.goals,
    ].forEach((item) => {
      if (item.year) years.add(Number(item.year));
    });

    const current = new Date().getFullYear();
    years.add(current);

    return [...years].sort((a, b) => b - a);
  }, [data]);

  const matchesPeriod = (item) => {
    if (period === "all") return true;

    if (period === "year") {
      return Number(item.year) === Number(year);
    }

    return (
      Number(item.year) === Number(year) &&
      Number(item.month) === Number(month)
    );
  };

  const filtered = useMemo(
    () => ({
      income: data.income.filter(matchesPeriod),
      expenses: data.expenses.filter(matchesPeriod),
      debts: data.debts.filter(matchesPeriod),
      goals: data.goals.filter(matchesPeriod),
    }),
    [data, period, year, month]
  );

  const totalIncome = filtered.income.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalExpense = filtered.expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalDebt = filtered.debts.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalSaving = filtered.goals.reduce(
    (sum, item) => sum + Number(item.monthly || 0),
    0
  );

  const remaining =
    totalIncome - totalExpense - totalDebt - totalSaving;

  const savingRate =
    totalIncome > 0
      ? Math.round((totalSaving / totalIncome) * 100)
      : 0;

  const addIncome = () => {
    if (!incomeForm.amount) return;

    const date = incomeForm.date
      ? new Date(incomeForm.date)
      : new Date();

    const item = {
      id: makeId(),
      owner: incomeForm.owner,
      name:
        incomeForm.description.trim() ||
        `Pemasukan ${incomeForm.owner}`,
      amount: Number(incomeForm.amount),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };

    setData((prev) => ({
      ...prev,
      income: [...prev.income, item],
    }));

    setIncomeForm({
      owner: "Ahmed",
      description: "",
      amount: "",
      date: "",
    });

    setShowIncome(false);
  };

  const addExpense = () => {
    if (!expenseForm.name || !expenseForm.amount) return;

    const date = expenseForm.date
      ? new Date(expenseForm.date)
      : new Date();

    const item = {
      id: makeId(),
      name: expenseForm.name,
      amount: Number(expenseForm.amount),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };

    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, item],
    }));

    setExpenseForm({
      name: "",
      amount: "",
      date: "",
    });

    setShowExpense(false);
  };

  const addDebt = () => {
    if (!debtForm.name || !debtForm.amount) return;

    const date = new Date();

    const item = {
      id: makeId(),
      name: debtForm.name,
      amount: Number(debtForm.amount),
      remaining: Number(debtForm.remaining || 0),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };

    setData((prev) => ({
      ...prev,
      debts: [...prev.debts, item],
    }));

    setDebtForm({
      name: "",
      amount: "",
      remaining: "",
    });

    setShowDebt(false);
  };

  const addGoal = () => {
    if (!goalForm.name || !goalForm.target) return;

    const date = new Date();

    const item = {
      id: makeId(),
      name: goalForm.name,
      target: Number(goalForm.target),
      saved: Number(goalForm.saved || 0),
      monthly: Number(goalForm.monthly || 0),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };

    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, item],
    }));

    setGoalForm({
      name: "",
      target: "",
      saved: "",
      monthly: "",
    });

    setShowGoal(false);
  };

  const removeItem = (type, id) => {
    setData((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  const periodLabel =
    period === "all"
      ? "Semua Periode"
      : period === "year"
      ? `Tahun ${year}`
      : `${months[month - 1]} ${year}`;

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>

          <div>
            <h1>Nabung Bersama</h1>
            <p>Financial planner Ahmed & Nia</p>
          </div>
        </div>

        <div className="period-control">
          <CalendarDays size={17} />

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="all">All</option>
            <option value="year">Tahun</option>
            <option value="month">Bulan</option>
          </select>

          {period !== "all" && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {availableYears.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}

          {period === "month" && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {months.map((item, index) => (
                <option key={item} value={index + 1}>
                  {item}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">FINANCIAL PLANNER</span>

          <h2>
            Bangun tabungan
            <br />
            bareng-bareng. 🌱
          </h2>

          <p>
            Kelola pemasukan Ahmed & Nia, kebutuhan,
            cicilan, dan target tabungan dalam satu tempat.
          </p>

          <div className="hero-period">
            <CalendarDays size={15} />
            {periodLabel}
          </div>
        </div>

        <div className="hero-saving">
          <div className="hero-label">
            Rencana tabungan
          </div>

          <strong>{money(totalSaving)}</strong>

          <span>per periode aktif</span>
        </div>
      </section>

      <section className="stats">
        <StatCard
          icon={<ArrowUpRight />}
          label="Pemasukan"
          value={money(totalIncome)}
          note={`${filtered.income.length} transaksi`}
        />

        <StatCard
          icon={<ArrowDownRight />}
          label="Pengeluaran"
          value={money(totalExpense)}
          note={`${filtered.expenses.length} transaksi`}
        />

        <StatCard
          icon={<PiggyBank />}
          label="Tabungan"
          value={money(totalSaving)}
          note={`${savingRate}% saving rate`}
        />

        <StatCard
          icon={<CircleDollarSign />}
          label="Sisa"
          value={money(remaining)}
          note={
            remaining >= 0
              ? "cashflow aman"
              : "alokasi melebihi pemasukan"
          }
          danger={remaining < 0}
        />
      </section>

      <div className="content-grid">
        <div>
          <SectionCard
            title="Pemasukan"
            subtitle="Tambah pemasukan Ahmed, Nia, atau sumber lainnya."
            icon={<Wallet size={18} />}
            button="+ Tambah"
            onClick={() => setShowIncome(!showIncome)}
          >
            {showIncome && (
              <FormBox>
                <select
                  value={incomeForm.owner}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      owner: e.target.value,
                    })
                  }
                >
                  <option>Ahmed</option>
                  <option>Nia</option>
                  <option>Lainnya</option>
                </select>

                <input
                  placeholder="Keterangan"
                  value={incomeForm.description}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      description: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Nominal"
                  value={incomeForm.amount}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      amount: e.target.value,
                    })
                  }
                />

                <input
                  type="date"
                  value={incomeForm.date}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      date: e.target.value,
                    })
                  }
                />

                <button className="save-btn" onClick={addIncome}>
                  Simpan
                </button>
              </FormBox>
            )}

            <TransactionList
              items={filtered.income}
              type="income"
              removeItem={removeItem}
            />
          </SectionCard>

          <SectionCard
            title="Pengeluaran"
            subtitle="Catat kebutuhan rutin dan pengeluaran lainnya."
            icon={<Home size={18} />}
            button="+ Tambah"
            onClick={() => setShowExpense(!showExpense)}
          >
            {showExpense && (
              <FormBox>
                <input
                  placeholder="Nama pengeluaran"
                  value={expenseForm.name}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Nominal"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                />

                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      date: e.target.value,
                    })
                  }
                />

                <button className="save-btn" onClick={addExpense}>
                  Simpan
                </button>
              </FormBox>
            )}

            <TransactionList
              items={filtered.expenses}
              type="expenses"
              removeItem={removeItem}
            />
          </SectionCard>

          <SectionCard
            title="Cicilan & Utang"
            subtitle="Pantau pembayaran dan sisa kewajiban."
            icon={<CreditCard size={18} />}
            button="+ Tambah"
            onClick={() => setShowDebt(!showDebt)}
          >
            {showDebt && (
              <FormBox>
                <input
                  placeholder="Nama cicilan / utang"
                  value={debtForm.name}
                  onChange={(e) =>
                    setDebtForm({
                      ...debtForm,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Bayar bulan ini"
                  value={debtForm.amount}
                  onChange={(e) =>
                    setDebtForm({
                      ...debtForm,
                      amount: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Sisa utang"
                  value={debtForm.remaining}
                  onChange={(e) =>
                    setDebtForm({
                      ...debtForm,
                      remaining: e.target.value,
                    })
                  }
                />

                <button className="save-btn" onClick={addDebt}>
                  Simpan
                </button>
              </FormBox>
            )}

            <TransactionList
              items={filtered.debts}
              type="debts"
              removeItem={removeItem}
              showRemaining
            />
          </SectionCard>
        </div>

        <div>
          <SectionCard
            id="goals"
            title="Target Tabungan"
            subtitle="Tentukan target dan setoran bulanannya."
            icon={<Target size={18} />}
            button="+ Target"
            onClick={() => setShowGoal(!showGoal)}
          >
            {showGoal && (
              <FormBox className="goal-form">
                <input
                  placeholder="Nama target"
                  value={goalForm.name}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Target"
                  value={goalForm.target}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      target: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Sudah terkumpul"
                  value={goalForm.saved}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      saved: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Setoran / bulan"
                  value={goalForm.monthly}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      monthly: e.target.value,
                    })
                  }
                />

                <button className="save-btn" onClick={addGoal}>
                  Simpan
                </button>
              </FormBox>
            )}

            <div className="goals">
              {filtered.goals.length === 0 ? (
                <Empty
                  icon={<Target />}
                  text="Belum ada target tabungan."
                />
              ) : (
                filtered.goals.map((goal) => {
                  const progress =
                    goal.target > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (goal.saved / goal.target) * 100
                          )
                        )
                      : 0;

                  return (
                    <div className="goal" key={goal.id}>
                      <div className="goal-header">
                        <div>
                          <strong>{goal.name}</strong>
                          <span>
                            {money(goal.saved)} dari{" "}
                            {money(goal.target)}
                          </span>
                        </div>

                        <button
                          className="icon-delete"
                          onClick={() =>
                            removeItem("goals", goal.id)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="progress">
                        <div
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <div className="goal-bottom">
                        <b>{progress}%</b>
                        <span>
                          {money(goal.monthly)} / bulan
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          <section className="card">
            <div className="section-title">
              <div>
                <div className="title-line">
                  <TrendingUp size={18} />
                  Ringkasan Keuangan
                </div>
                <p>Komposisi periode aktif.</p>
              </div>
            </div>

            <div className="summary-list">
              <SummaryRow
                label="Pemasukan"
                value={totalIncome}
              />

              <SummaryRow
                label="Kebutuhan"
                value={totalExpense}
              />

              <SummaryRow
                label="Cicilan"
                value={totalDebt}
              />

              <SummaryRow
                label="Tabungan"
                value={totalSaving}
              />

              <div className="summary-total">
                <span>Sisa uang</span>
                <strong>{money(remaining)}</strong>
              </div>
            </div>

            <div
              className={
                remaining < 0
                  ? "insight danger"
                  : "insight"
              }
            >
              <strong>
                {remaining < 0
                  ? "⚠️ Cashflow perlu diperbaiki"
                  : savingRate >= 30
                  ? "🔥 Saving rate bagus"
                  : "💡 Tetap konsisten"}
              </strong>

              <span>
                {remaining < 0
                  ? "Total alokasi kamu lebih besar dari pemasukan."
                  : savingRate >= 30
                  ? "Kamu sudah mengalokasikan minimal 30% untuk tabungan."
                  : "Naikkan tabungan perlahan setelah kebutuhan wajib aman."}
              </span>
            </div>
          </section>

          <section className="card">
            <div className="section-title">
              <div>
                <div className="title-line">
                  <CalendarDays size={18} />
                  Periode
                </div>
                <p>
                  Filter saat ini: <b>{periodLabel}</b>
                </p>
              </div>
            </div>

            <div className="period-info">
              <div>
                <span>Transaksi</span>
                <strong>
                  {filtered.income.length +
                    filtered.expenses.length +
                    filtered.debts.length}
                </strong>
              </div>

              <div>
                <span>Target</span>
                <strong>{filtered.goals.length}</strong>
              </div>

              <div>
                <span>Saving Rate</span>
                <strong>{savingRate}%</strong>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer>
        Nabung Bersama · Ahmed & Nia
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, note, danger }) {
  return (
    <div className={`stat-card ${danger ? "danger-card" : ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>

      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  button,
  onClick,
  children,
}) {
  return (
    <section className="card">
      <div className="section-title">
        <div>
          <div className="title-line">
            {icon}
            {title}
          </div>
          <p>{subtitle}</p>
        </div>

        <button className="add-btn" onClick={onClick}>
          <Plus size={15} />
          {button.replace("+ ", "")}
        </button>
      </div>

      {children}
    </section>
  );
}

function FormBox({ children, className = "" }) {
  return <div className={`form-box ${className}`}>{children}</div>;
}

function TransactionList({
  items,
  type,
  removeItem,
  showRemaining,
}) {
  if (!items.length) {
    return (
      <Empty
        icon={<CircleDollarSign />}
        text="Belum ada data."
      />
    );
  }

  return (
    <div className="transactions">
      {items.map((item) => (
        <div className="transaction" key={item.id}>
          <div className="transaction-icon">
            {type === "income" ? (
              <ArrowUpRight size={17} />
            ) : type === "debts" ? (
              <CreditCard size={17} />
            ) : (
              <ArrowDownRight size={17} />
            )}
          </div>

          <div className="transaction-info">
            <strong>{item.name}</strong>

            <span>
              {item.owner
                ? item.owner
                : `${item.month}/${item.year}`}
            </span>

            {showRemaining && item.remaining > 0 && (
              <small>
                Sisa: {money(item.remaining)}
              </small>
            )}
          </div>

          <strong className="transaction-money">
            {money(item.amount)}
          </strong>

          <button
            className="icon-delete"
            onClick={() => removeItem(type, item.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="empty">
      <div>{icon}</div>
      <span>{text}</span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{money(value)}</strong>
    </div>
  );
}

export default App;
