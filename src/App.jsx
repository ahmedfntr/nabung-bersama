import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, Bell, CalendarDays, Check,
  ChevronDown, CreditCard, Edit3, History, LogOut, PieChart,
  PiggyBank, Plus, RefreshCw, Target, Trash2, Wallet, X
} from "lucide-react";
import { supabase } from "./lib/supabase";

const HOUSEHOLD_ID = "a548fbaa-26c0-436a-bd3f-a7664639eccd";
const DEFAULT_CATEGORIES = ["Makan", "Transportasi", "Belanja", "Tagihan", "Hiburan", "Kesehatan", "Lainnya"];

const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const dateText = d => d ? new Date(`${d}T00:00:00`).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "-";
const today = () => new Date().toISOString().slice(0,10);
const pct = (a,b) => b ? Math.min(100,Math.max(0,(a/b)*100)) : 0;

function Modal({title,onClose,children}){return <div className="modal-overlay"><div className="modal-card"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>{children}</div></div>}
function Actions({cancel,loading,text="Simpan"}){return <div className="form-actions"><button type="button" className="btn ghost" onClick={cancel}>Batal</button><button className="btn primary" disabled={loading}>{loading?"Menyimpan...":text}</button></div>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Form({children,onSubmit}){return <form onSubmit={onSubmit}>{children}</form>}

function Login({onLogin}){
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(e){e.preventDefault();setBusy(true);setError("");const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);else onLogin(data.session);setBusy(false)}
  return <div className="login-page"><div className="login-card"><div className="brand-mark"><PiggyBank size={34}/></div><h1>Nabung Bersama</h1><p>Financial planner Ahmed & Nia</p><Form onSubmit={submit}><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></Field><Field label="Password"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></Field>{error&&<div className="alert">{error}</div>}<button className="btn primary wide" disabled={busy}>{busy?"Masuk...":"Masuk"}</button></Form></div></div>
}

function Stat({title,value,icon,kind}){return <div className={`stat ${kind}`}><div className="stat-icon">{icon}</div><div><small>{title}</small><strong>{money(value)}</strong></div></div>}

function IncomeForm({initial,onDone,cancel}){
  const [f,setF]=useState({owner:initial?.owner||"Ahmed",amount:initial?.amount||"",description:initial?.description||"",transaction_date:initial?.transaction_date||today()}),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();setBusy(true);await onDone({...f,amount:Number(f.amount)});setBusy(false)};
  return <Form onSubmit={save}><Field label="Pemilik"><select value={f.owner} onChange={e=>setF({...f,owner:e.target.value})}><option>Ahmed</option><option>Nia</option><option>Lainnya</option></select></Field><Field label="Nominal"><input type="number" min="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/></Field><Field label="Keterangan"><input value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></Field><Field label="Tanggal"><input type="date" value={f.transaction_date} onChange={e=>setF({...f,transaction_date:e.target.value})} required/></Field><Actions cancel={cancel} loading={busy} text={initial?"Update":"Simpan"}/></Form>
}

function ExpenseForm({initial,categories,onDone,cancel}){
  const [f,setF]=useState({name:initial?.name||"",category:initial?.category||categories[0]||"Lainnya",amount:initial?.amount||"",transaction_date:initial?.transaction_date||today()}),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();setBusy(true);await onDone({...f,amount:Number(f.amount)});setBusy(false)};
  return <Form onSubmit={save}><Field label="Nama Pengeluaran"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></Field><Field label="Kategori"><select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Nominal"><input type="number" min="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/></Field><Field label="Tanggal"><input type="date" value={f.transaction_date} onChange={e=>setF({...f,transaction_date:e.target.value})} required/></Field><Actions cancel={cancel} loading={busy} text={initial?"Update":"Simpan"}/></Form>
}

function DebtForm({initial,onDone,cancel}){
  const [f,setF]=useState({name:initial?.name||"",amount:initial?.amount||"",remaining:initial?.remaining??"",transaction_date:initial?.transaction_date||today()}),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();setBusy(true);await onDone({...f,amount:Number(f.amount),remaining:Number(f.remaining||f.amount)});setBusy(false)};
  return <Form onSubmit={save}><Field label="Nama Cicilan / Utang"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></Field><Field label="Total Utang"><input type="number" min="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/></Field><Field label="Sisa Utang"><input type="number" min="0" value={f.remaining} onChange={e=>setF({...f,remaining:e.target.value})}/></Field><Field label="Tanggal"><input type="date" value={f.transaction_date} onChange={e=>setF({...f,transaction_date:e.target.value})}/></Field><Actions cancel={cancel} loading={busy} text={initial?"Update":"Simpan"}/></Form>
}

function GoalForm({initial,onDone,cancel}){
  const [f,setF]=useState({name:initial?.name||"",target:initial?.target||"",saved:initial?.saved||"",monthly:initial?.monthly||"",target_date:initial?.target_date||""}),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();setBusy(true);await onDone({...f,target:Number(f.target),saved:Number(f.saved||0),monthly:Number(f.monthly||0),target_date:f.target_date||null});setBusy(false)};
  return <Form onSubmit={save}><Field label="Nama Target"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></Field><Field label="Target"><input type="number" min="0" value={f.target} onChange={e=>setF({...f,target:e.target.value})} required/></Field><Field label="Sudah Terkumpul"><input type="number" min="0" value={f.saved} onChange={e=>setF({...f,saved:e.target.value})}/></Field><Field label="Target / Bulan"><input type="number" min="0" value={f.monthly} onChange={e=>setF({...f,monthly:e.target.value})}/></Field><Field label="Tanggal Target"><input type="date" value={f.target_date} onChange={e=>setF({...f,target_date:e.target.value})}/></Field><Actions cancel={cancel} loading={busy} text={initial?"Update":"Simpan"}/></Form>
}

function PaymentForm({debt,onDone,cancel}){
  const [amount,setAmount]=useState(""),[date,setDate]=useState(today()),[note,setNote]=useState(""),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();const n=Number(amount);if(n<=0||n>Number(debt.remaining))return alert("Nominal pembayaran tidak valid.");setBusy(true);await onDone({amount:n,payment_date:date,note});setBusy(false)};
  return <Form onSubmit={save}><div className="mini-note">Sisa saat ini: <b>{money(debt.remaining)}</b></div><Field label="Nominal Pembayaran"><input type="number" min="1" max={debt.remaining} value={amount} onChange={e=>setAmount(e.target.value)} required/></Field><Field label="Tanggal"><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></Field><Field label="Catatan"><input value={note} onChange={e=>setNote(e.target.value)}/></Field><Actions cancel={cancel} loading={busy}/></Form>
}

function BudgetForm({initial,categories,onDone,cancel}){
  const now=new Date(),[f,setF]=useState({category:initial?.category||categories[0]||"Lainnya",amount:initial?.amount||"",year:initial?.year||now.getFullYear(),month:initial?.month||now.getMonth()+1}),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();setBusy(true);await onDone({...f,amount:Number(f.amount),year:Number(f.year),month:Number(f.month)});setBusy(false)};
  return <Form onSubmit={save}><Field label="Kategori"><select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Budget"><input type="number" min="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/></Field><div className="form-row"><Field label="Tahun"><input type="number" value={f.year} onChange={e=>setF({...f,year:e.target.value})}/></Field><Field label="Bulan"><select value={f.month} onChange={e=>setF({...f,month:e.target.value})}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></Field></div><Actions cancel={cancel} loading={busy} text={initial?"Update":"Simpan"}/></Form>
}

function ReminderForm({onDone,cancel}){
  const [f,setF]=useState({title:"",reminder_date:today(),note:""}),[busy,setBusy]=useState(false);
  const save=async e=>{e.preventDefault();setBusy(true);await onDone(f);setBusy(false)};
  return <Form onSubmit={save}><Field label="Judul Reminder"><input value={f.title} onChange={e=>setF({...f,title:e.target.value})} required/></Field><Field label="Tanggal"><input type="date" value={f.reminder_date} onChange={e=>setF({...f,reminder_date:e.target.value})} required/></Field><Field label="Catatan"><input value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></Field><Actions cancel={cancel} loading={busy}/></Form>
}

function App(){
  const [session,setSession]=useState(null),[user,setUser]=useState(null),[household,setHousehold]=useState(null),[loading,setLoading]=useState(true);
  const [data,setData]=useState({income:[],expenses:[],debts:[],goals:[],payments:[],budgets:[],reminders:[],categories:[]});
  const [tab,setTab]=useState("dashboard"),[period,setPeriod]=useState("all"),[year,setYear]=useState(new Date().getFullYear()),[month,setMonth]=useState(new Date().getMonth()+1);
  const [modal,setModal]=useState(null),[editing,setEditing]=useState(null);

  useEffect(()=>{let mounted=true;supabase.auth.getSession().then(({data})=>{if(mounted){setSession(data.session);setUser(data.session?.user||null);setLoading(false)}});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setUser(s?.user||null);setLoading(false)});return()=>{mounted=false;subscription.unsubscribe()}},[]);
  useEffect(()=>{if(!user)return;supabase.from("household_members").select("household_id,households(id,name)").eq("user_id",user.id).eq("household_id",HOUSEHOLD_ID).single().then(({data,error})=>{if(error)console.error(error);else setHousehold(data?.households||null)})},[user]);

  const loaders={
    income:async()=>{const {data,error}=await supabase.from("income").select("*").eq("household_id",HOUSEHOLD_ID).order("transaction_date",{ascending:false});if(!error)setData(d=>({...d,income:data||[]}))},
    expenses:async()=>{const {data,error}=await supabase.from("expenses").select("*").eq("household_id",HOUSEHOLD_ID).order("transaction_date",{ascending:false});if(!error)setData(d=>({...d,expenses:data||[]}))},
    debts:async()=>{const {data,error}=await supabase.from("debts").select("*").eq("household_id",HOUSEHOLD_ID).order("transaction_date",{ascending:false});if(!error)setData(d=>({...d,debts:data||[]}))},
    goals:async()=>{const {data,error}=await supabase.from("goals").select("*").eq("household_id",HOUSEHOLD_ID).order("created_at",{ascending:false});if(!error)setData(d=>({...d,goals:data||[]}))},
    payments:async()=>{const {data,error}=await supabase.from("debt_payments").select("*").eq("household_id",HOUSEHOLD_ID).order("payment_date",{ascending:false});if(!error)setData(d=>({...d,payments:data||[]}))},
    budgets:async()=>{const {data,error}=await supabase.from("budgets").select("*").eq("household_id",HOUSEHOLD_ID);if(!error)setData(d=>({...d,budgets:data||[]}))},
    reminders:async()=>{const {data,error}=await supabase.from("reminders").select("*").eq("household_id",HOUSEHOLD_ID).order("reminder_date");if(!error)setData(d=>({...d,reminders:data||[]}))},
    categories:async()=>{const {data,error}=await supabase.from("expense_categories").select("*").eq("household_id",HOUSEHOLD_ID).order("name");if(!error)setData(d=>({...d,categories:data?.map(x=>x.name)||[]}))}
  };

  useEffect(()=>{if(!user||!household)return;Object.values(loaders).forEach(fn=>fn());const tables=["income","expenses","debts","goals","debt_payments","budgets","reminders","expense_categories"];const channels=tables.map(table=>supabase.channel(`rt-${table}`).on("postgres_changes",{event:"*",schema:"public",table,filter:`household_id=eq.${HOUSEHOLD_ID}`},()=>{if(table==="expense_categories")loaders.categories();else loaders[table==="debt_payments"?"payments":table]();}).subscribe());return()=>channels.forEach(c=>supabase.removeChannel(c))},[user,household]);

  const categories=useMemo(()=>Array.from(new Set([...DEFAULT_CATEGORIES,...data.categories])),[data.categories]);
  const matches=arr=>period==="all"?arr:arr.filter(x=>{const d=x.transaction_date||x.payment_date||x.target_date||x.created_at?.slice(0,10);if(!d)return false;const z=new Date(`${d}T00:00:00`);return period==="year"?z.getFullYear()===Number(year):z.getFullYear()===Number(year)&&z.getMonth()+1===Number(month)});
  const income=matches(data.income),expenses=matches(data.expenses);
  const totalIncome=income.reduce((s,x)=>s+Number(x.amount||0),0),totalExpenses=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
  const totalSaved=data.goals.reduce((s,x)=>s+Number(x.saved||0),0),totalDebt=data.debts.reduce((s,x)=>s+Number(x.remaining||0),0),remaining=totalIncome-totalExpenses;

  const upsert=async(table,payload,id)=>{const q=id?supabase.from(table).update(payload).eq("id",id).eq("household_id",HOUSEHOLD_ID):supabase.from(table).insert({...payload,household_id:HOUSEHOLD_ID});const {error}=await q;if(error){alert(error.message);return false}return true};
  const remove=async(table,id)=>{if(!confirm("Hapus data ini?"))return;const {error}=await supabase.from(table).delete().eq("id",id).eq("household_id",HOUSEHOLD_ID);if(error)alert(error.message)};

  async function saveIncome(p){if(await upsert("income",p,editing?.id)){setModal(null);setEditing(null);loaders.income()}}
  async function saveExpense(p){if(await upsert("expenses",p,editing?.id)){setModal(null);setEditing(null);loaders.expenses()}}
  async function saveDebt(p){if(await upsert("debts",p,editing?.id)){setModal(null);setEditing(null);loaders.debts()}}
  async function saveGoal(p){if(await upsert("goals",p,editing?.id)){setModal(null);setEditing(null);loaders.goals()}}
  async function saveBudget(p){if(await upsert("budgets",p,editing?.id)){setModal(null);setEditing(null);loaders.budgets()}}
  async function saveReminder(p){if(await upsert("reminders",p,editing?.id)){setModal(null);setEditing(null);loaders.reminders()}}

  async function payDebt(p){
    const ok=await upsert("debt_payments",{...p,debt_id:editing.id},null);
    if(!ok)return;
    const next=Math.max(0,Number(editing.remaining)-Number(p.amount));
    await supabase.from("debts").update({remaining:next}).eq("id",editing.id).eq("household_id",HOUSEHOLD_ID);
    setModal(null);setEditing(null);loaders.debts();loaders.payments();
  }

  async function addCategory(){
    const name=prompt("Nama kategori baru:")?.trim();if(!name)return;
    const {error}=await supabase.from("expense_categories").insert({name,household_id:HOUSEHOLD_ID});
    if(error)alert(error.message);else loaders.categories();
  }

  async function markReminder(r){
    await supabase.from("reminders").update({done:!r.done}).eq("id",r.id).eq("household_id",HOUSEHOLD_ID);loaders.reminders();
  }

  async function notify(){
    if(!("Notification" in window))return alert("Browser ini tidak mendukung notifikasi.");
    if(Notification.permission==="default")await Notification.requestPermission();
    if(Notification.permission==="granted")new Notification("Nabung Bersama",{body:"Notifikasi aktif untuk reminder keuangan."});
  }

  if(loading)return <div className="loading">Memuat...</div>;
  if(!session)return <Login onLogin={setSession}/>;

  const nav=[
    ["dashboard","Dashboard",<PieChart size={18}/>],
    ["transactions","Transaksi",<History size={18}/>],
    ["debts","Cicilan",<CreditCard size={18}/>],
    ["goals","Target",<Target size={18}/>],
    ["budget","Budget",<Wallet size={18}/>],
    ["reminders","Reminder",<Bell size={18}/>]
  ];

  return <div className="app">
    <header className="topbar"><div className="brand"><div className="brand-mark small"><PiggyBank size={22}/></div><div><b>Nabung Bersama</b><span>{household?.name||"Ahmed & Nia"}</span></div></div><div className="top-actions"><button className="btn ghost" onClick={notify}><Bell size={16}/> Notifikasi</button><button className="btn ghost" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Keluar</button></div></header>
    <div className="layout">
      <aside className="sidebar">{nav.map(([id,label,icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{icon}<span>{label}</span></button>)}</aside>
      <main className="main">
        <div className="page-head"><div><span className="eyebrow">FINANCIAL PLANNER</span><h1>{nav.find(x=>x[0]===tab)?.[1]}</h1><p>Kelola keuangan Ahmed & Nia secara realtime.</p></div><div className="filters"><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Semua</option><option value="year">Tahun</option><option value="month">Bulan</option></select>{period!=="all"&&<input type="number" value={year} onChange={e=>setYear(e.target.value)} min="2020" max="2100"/>}{period==="month"&&<select value={month} onChange={e=>setMonth(e.target.value)}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>}</div></div>

        {tab==="dashboard"&&<Dashboard totalIncome={totalIncome} totalExpenses={totalExpenses} totalSaved={totalSaved} remaining={remaining} totalDebt={totalDebt} goals={data.goals} expenses={expenses} budgets={data.budgets.filter(b=>Number(b.year)===Number(year)&&Number(b.month)===Number(month))}/>}
        {tab==="transactions"&&<Transactions income={income} expenses={expenses} categories={categories} addCategory={addCategory} onAddIncome={()=>{setEditing(null);setModal("income")}} onAddExpense={()=>{setEditing(null);setModal("expense")}} onEdit={(type,x)=>{setEditing(x);setModal(type)}} onDelete={(t,id)=>remove(t,id)}/>}
        {tab==="debts"&&<Debts debts={data.debts} payments={data.payments} onAdd={()=>{setEditing(null);setModal("debt")}} onEdit={x=>{setEditing(x);setModal("debt")}} onPay={x=>{setEditing(x);setModal("payment")}} onDelete={id=>remove("debts",id)}/>}
        {tab==="goals"&&<Goals goals={data.goals} onAdd={()=>{setEditing(null);setModal("goal")}} onEdit={x=>{setEditing(x);setModal("goal")}} onDelete={id=>remove("goals",id)}/>}
        {tab==="budget"&&<Budget budgets={data.budgets.filter(b=>Number(b.year)===Number(year)&&Number(b.month)===Number(month))} expenses={data.expenses.filter(x=>{const d=x.transaction_date?new Date(`${x.transaction_date}T00:00:00`):null;return d&&d.getFullYear()===Number(year)&&d.getMonth()+1===Number(month)})} onAdd={()=>{setEditing(null);setModal("budget")}} onEdit={x=>{setEditing(x);setModal("budget")}} onDelete={id=>remove("budgets",id)}/>}
        {tab==="reminders"&&<Reminders reminders={data.reminders} onAdd={()=>{setEditing(null);setModal("reminder")}} onToggle={markReminder} onDelete={id=>remove("reminders",id)}/>}
      </main>
    </div>

    {modal==="income"&&<Modal title={editing?"Edit Pemasukan":"Tambah Pemasukan"} onClose={()=>{setModal(null);setEditing(null)}}><IncomeForm initial={editing} onDone={saveIncome} cancel={()=>setModal(null)}/></Modal>}
    {modal==="expense"&&<Modal title={editing?"Edit Pengeluaran":"Tambah Pengeluaran"} onClose={()=>{setModal(null);setEditing(null)}}><ExpenseForm initial={editing} categories={categories} onDone={saveExpense} cancel={()=>setModal(null)}/></Modal>}
    {modal==="debt"&&<Modal title={editing?"Edit Cicilan":"Tambah Cicilan"} onClose={()=>{setModal(null);setEditing(null)}}><DebtForm initial={editing} onDone={saveDebt} cancel={()=>setModal(null)}/></Modal>}
    {modal==="payment"&&<Modal title="Bayar Cicilan" onClose={()=>{setModal(null);setEditing(null)}}><PaymentForm debt={editing} onDone={payDebt} cancel={()=>setModal(null)}/></Modal>}
    {modal==="goal"&&<Modal title={editing?"Edit Target":"Tambah Target"} onClose={()=>{setModal(null);setEditing(null)}}><GoalForm initial={editing} onDone={saveGoal} cancel={()=>setModal(null)}/></Modal>}
    {modal==="budget"&&<Modal title={editing?"Edit Budget":"Tambah Budget"} onClose={()=>{setModal(null);setEditing(null)}}><BudgetForm initial={editing} categories={categories} onDone={saveBudget} cancel={()=>setModal(null)}/></Modal>}
    {modal==="reminder"&&<Modal title="Tambah Reminder" onClose={()=>setModal(null)}><ReminderForm onDone={saveReminder} cancel={()=>setModal(null)}/></Modal>}
  </div>
}

function Dashboard({totalIncome,totalExpenses,totalSaved,remaining,totalDebt,goals,expenses,budgets}){
  const byCat=expenses.reduce((a,x)=>{a[x.category||"Lainnya"]=(a[x.category||"Lainnya"]||0)+Number(x.amount||0);return a},{});
  return <div className="stack"><div className="stats"><Stat title="Pemasukan" value={totalIncome} kind="income" icon={<ArrowUpCircle/>}/><Stat title="Pengeluaran" value={totalExpenses} kind="expense" icon={<ArrowDownCircle/>}/><Stat title="Tabungan" value={totalSaved} kind="saving" icon={<PiggyBank/>}/><Stat title="Sisa Dana" value={remaining} kind="remaining" icon={<Wallet/>}/><Stat title="Sisa Utang" value={totalDebt} kind="debt" icon={<CreditCard/>}/></div><div className="grid2"><Card title="Pengeluaran per Kategori"><Bars data={byCat}/></Card><Card title="Progress Target"><div className="goal-list">{goals.length?goals.map(g=><div key={g.id} className="progress-item"><div><b>{g.name}</b><span>{money(g.saved)} / {money(g.target)}</span></div><div className="progress"><i style={{width:`${pct(g.saved,g.target)}%`}}/></div></div>):<Empty/>}</div></Card></div><Card title="Budget Bulan Ini"><div className="goal-list">{budgets.length?budgets.map(b=>{const spent=expenses.filter(e=>(e.category||"Lainnya")===b.category).reduce((s,e)=>s+Number(e.amount||0),0);return <div className="progress-item" key={b.id}><div><b>{b.category}</b><span>{money(spent)} / {money(b.amount)}</span></div><div className="progress"><i style={{width:`${pct(spent,b.amount)}%`}}/></div></div>}):<Empty text="Belum ada budget."/ >}</div></Card></div>
}
function Bars({data}){const max=Math.max(1,...Object.values(data));return Object.keys(data).length?<div className="bars">{Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div className="bar-row" key={k}><span>{k}</span><div><i style={{width:`${(v/max)*100}%`}}/></div><b>{money(v)}</b></div>)}</div>:<Empty text="Belum ada transaksi."/>}
function Card({title,children,action}){return <section className="card"><div className="card-head"><h2>{title}</h2>{action}</div>{children}</section>}
function Empty({text="Belum ada data."}){return <div className="empty">{text}</div>}

function Transactions({income,expenses,categories,addCategory,onAddIncome,onAddExpense,onEdit,onDelete}){
 return <div className="stack"><div className="toolbar"><div><b>Pemasukan & Pengeluaran</b><span>{income.length+expenses.length} transaksi</span></div><div className="toolbar-actions"><button className="btn ghost" onClick={addCategory}>+ Kategori</button><button className="btn primary" onClick={onAddIncome}><Plus size={16}/> Pemasukan</button><button className="btn primary" onClick={onAddExpense}><Plus size={16}/> Pengeluaran</button></div></div><Card title="Pemasukan"><List items={income} type="income" onEdit={x=>onEdit("income",x)} onDelete={x=>onDelete("income",x.id)}/></Card><Card title="Pengeluaran"><List items={expenses} type="expense" onEdit={x=>onEdit("expense",x)} onDelete={x=>onDelete("expenses",x.id)}/></Card></div>
}
function List({items,type,onEdit,onDelete}){
 return items.length?<div className="list">{items.map(x=><div className="list-item" key={x.id}><div className="list-icon">{type==="income"?<ArrowUpCircle/>:<ArrowDownCircle/>}</div><div className="list-main"><b>{type==="income"?x.owner:x.name}</b><span>{type==="income"?x.description||"Pemasukan":x.category||"Lainnya"} · {dateText(x.transaction_date)}</span></div><strong className={type==="expense"?"negative":""}>{type==="expense"?"-":""}{money(x.amount)}</strong><button className="icon-btn" onClick={()=>onEdit(x)}><Edit3 size={16}/></button><button className="icon-btn danger" onClick={()=>onDelete(x)}><Trash2 size={16}/></button></div>)}</div>:<Empty/>
}

function Debts({debts,payments,onAdd,onEdit,onPay,onDelete}){
 return <div className="stack"><div className="toolbar"><div><b>Cicilan / Utang</b><span>Bayar akan otomatis mengurangi sisa utang.</span></div><button className="btn primary" onClick={onAdd}><Plus size={16}/> Tambah</button></div><Card title="Daftar Utang">{debts.length?<div className="debt-grid">{debts.map(d=><div className="debt-card" key={d.id}><div className="debt-top"><b>{d.name}</b><span>{dateText(d.transaction_date)}</span></div><div className="debt-number">{money(d.remaining)}</div><small>sisa dari {money(d.amount)}</small><div className="progress"><i style={{width:`${pct(Number(d.amount)-Number(d.remaining),d.amount)}%`}}/></div><div className="row-actions"><button className="btn primary" onClick={()=>onPay(d)}>Bayar</button><button className="icon-btn" onClick={()=>onEdit(d)}><Edit3 size={16}/></button><button className="icon-btn danger" onClick={()=>onDelete(d.id)}><Trash2 size={16}/></button></div></div>)}</div>:<Empty/>}</Card><Card title="Riwayat Pembayaran">{payments.length?<ListPayments payments={payments} debts={debts}/>:<Empty/>}</Card></div>
}
function ListPayments({payments,debts}){return <div className="list">{payments.map(p=><div className="list-item" key={p.id}><div className="list-icon"><Check/></div><div className="list-main"><b>{debts.find(d=>d.id===p.debt_id)?.name||"Utang"}</b><span>{dateText(p.payment_date)} · {p.note||"Pembayaran"}</span></div><strong>{money(p.amount)}</strong></div>)}</div>}

function Goals({goals,onAdd,onEdit,onDelete}){return <div className="stack"><div className="toolbar"><div><b>Target Tabungan</b><span>Progress tersimpan realtime.</span></div><button className="btn primary" onClick={onAdd}><Plus size={16}/> Tambah</button></div><div className="goal-grid">{goals.length?goals.map(g=><Card key={g.id} title={g.name} action={<div className="item-actions"><button className="icon-btn" onClick={()=>onEdit(g)}><Edit3 size={16}/></button><button className="icon-btn danger" onClick={()=>onDelete(g.id)}><Trash2 size={16}/></button></div>}><div className="big-percent">{Math.round(pct(g.saved,g.target))}%</div><div className="progress big"><i style={{width:`${pct(g.saved,g.target)}%`}}/></div><div className="goal-meta"><span>{money(g.saved)} terkumpul</span><span>Target {money(g.target)}</span></div><small>{g.monthly?`Rencana ${money(g.monthly)}/bulan · `:""}{g.target_date?`Target ${dateText(g.target_date)}`:"Tanggal belum diatur"}</small></Card>):<Empty/>}</div></div>}

function Budget({budgets,expenses,onAdd,onEdit,onDelete}){return <div className="stack"><div className="toolbar"><div><b>Budget Bulanan</b><span>Atur batas pengeluaran per kategori.</span></div><button className="btn primary" onClick={onAdd}><Plus size={16}/> Tambah</button></div><Card title="Budget">{budgets.length?<div className="budget-list">{budgets.map(b=>{const spent=expenses.filter(e=>(e.category||"Lainnya")===b.category).reduce((s,e)=>s+Number(e.amount||0),0),over=spent>b.amount;return <div className="budget-row" key={b.id}><div><b>{b.category}</b><span>{money(spent)} terpakai dari {money(b.amount)}</span></div><div className="progress"><i style={{width:`${pct(spent,b.amount)}%`}}/></div><strong className={over?"negative":""}>{Math.round(pct(spent,b.amount))}%</strong><button className="icon-btn" onClick={()=>onEdit(b)}><Edit3 size={16}/></button><button className="icon-btn danger" onClick={()=>onDelete(b.id)}><Trash2 size={16}/></button></div>})}</div>:<Empty text="Belum ada budget untuk periode ini."/>}</Card></div>}

function Reminders({reminders,onAdd,onToggle,onDelete}){const due=reminders.filter(r=>!r.done&&r.reminder_date<=today());return <div className="stack"><div className="toolbar"><div><b>Reminder</b><span>{due.length?`${due.length} reminder perlu diperhatikan.`:"Tidak ada reminder jatuh tempo."}</span></div><button className="btn primary" onClick={onAdd}><Plus size={16}/> Tambah</button></div><Card title="Daftar Reminder">{reminders.length?<div className="list">{reminders.map(r=><div className={`list-item ${r.done?"done":""}`} key={r.id}><button className="check-btn" onClick={()=>onToggle(r)}>{r.done?<Check size={16}/>:null}</button><div className="list-main"><b>{r.title}</b><span>{dateText(r.reminder_date)} · {r.note||"Tanpa catatan"}</span></div>{!r.done&&r.reminder_date<=today()&&<span className="badge">Jatuh tempo</span>}<button className="icon-btn danger" onClick={()=>onDelete(r.id)}><Trash2 size={16}/></button></div>)}</div>:<Empty/>}</Card></div>}

export default App;
