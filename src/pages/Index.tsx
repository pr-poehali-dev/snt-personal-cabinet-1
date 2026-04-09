import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";

const API = {
  auth: "https://functions.poehali.dev/6020abb6-f3d9-44d7-87b3-fe42a2d7fa88",
  data: "https://functions.poehali.dev/a0c8ee04-d631-4136-ade4-3e04f9a2a939",
  import: "https://functions.poehali.dev/15a1f5da-3a39-4ae2-8f5c-a80476dafdc5",
};

interface User {
  user_id: number;
  login: string;
  role: "user" | "admin";
  is_first_login: boolean;
  plot: string | null;
}

interface Charge {
  id: number;
  service: string;
  period: string;
  amount: number;
  due_date: string;
}

interface Payment {
  id: number;
  service: string;
  amount: number;
  date: string;
}

interface PlotSummary {
  plot: string;
  charged_membership: number;
  charged_electricity: number;
  paid_membership: number;
  paid_electricity: number;
  balance_membership: number;
  balance_electricity: number;
}

// ─── Экран входа ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", login: login.trim().toLowerCase(), password }),
      });
      const data = JSON.parse(await res.text());
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        if (data.show_reset) setShowReset(true);
      } else {
        onLogin(data);
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    try {
      await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", login: login.trim().toLowerCase() }),
      });
      setResetDone(true);
      setShowReset(false);
      setError("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-golos flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Icon name="Home" size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Мой Портал</h1>
          <p className="text-muted-foreground mt-2 text-base">Войдите в личный кабинет</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          {resetDone && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-base flex items-center gap-2">
              <Icon name="CheckCircle" size={18} />
              Пароль сброшен до «1111»
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                Номер участка / Логин
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Например: 42 или 58а"
                className="w-full border border-border rounded-xl px-4 py-3 text-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full border border-border rounded-xl px-4 py-3 text-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-base flex items-center gap-2">
                <Icon name="AlertCircle" size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !login || !password}
              className="w-full bg-primary text-primary-foreground text-lg font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          {showReset && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="mt-4 w-full border border-border text-muted-foreground text-base py-3 rounded-xl hover:bg-secondary transition-colors"
            >
              Сбросить пароль до «1111»
            </button>
          )}
        </div>
        <p className="text-center text-muted-foreground text-sm mt-6">
          При первом входе вам будет предложено задать свой пароль
        </p>
      </div>
    </div>
  );
}

// ─── Установка пароля при первом входе ──────────────────────────────────────

function SetPasswordScreen({ user, onDone }: { user: User; onDone: (u: User) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) { setError("Пароль не менее 4 символов"); return; }
    if (password !== confirm) { setError("Пароли не совпадают"); return; }
    setLoading(true);
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_password", user_id: user.user_id, password }),
      });
      if (res.ok) {
        onDone({ ...user, is_first_login: false });
      } else {
        setError("Ошибка сохранения пароля");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-golos flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Icon name="KeyRound" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Задайте пароль</h1>
          <p className="text-muted-foreground mt-2 text-base">Это ваш первый вход. Придумайте пароль для дальнейшего использования.</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <form onSubmit={handleSet} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Не менее 4 символов"
                className="w-full border border-border rounded-xl px-4 py-3 text-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Повторите пароль"
                className="w-full border border-border rounded-xl px-4 py-3 text-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-base flex items-center gap-2">
                <Icon name="AlertCircle" size={18} />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-primary text-primary-foreground text-lg font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Сохранить пароль"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Кабинет пользователя ───────────────────────────────────────────────────

function UserCabinet({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"membership" | "electricity" | "notifications">("membership");
  const [membershipSub, setMembershipSub] = useState<"charges" | "payments" | "balance">("charges");
  const [electricitySub, setElectricitySub] = useState<"charges" | "payments" | "balance">("charges");
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API.data}?plot=${user.plot}`)
      .then((r) => r.json())
      .then((d) => { setCharges(d.charges || []); setPayments(d.payments || []); })
      .finally(() => setLoading(false));
  }, [user.plot]);

  const membershipCharges = charges.filter((c) => c.service.toLowerCase().includes("взнос") || c.service.toLowerCase().includes("членск"));
  const electricityCharges = charges.filter((c) => c.service.toLowerCase().includes("электро"));
  const membershipPayments = payments.filter((p) => p.service.toLowerCase().includes("взнос") || p.service.toLowerCase().includes("членск"));
  const electricityPayments = payments.filter((p) => p.service.toLowerCase().includes("электро"));

  const statusLabel = {
    paid: { label: "Оплачено", color: "text-green-700 bg-green-50 border-green-200" },
    pending: { label: "Ожидает", color: "text-amber-700 bg-amber-50 border-amber-200" },
    overdue: { label: "Просрочено", color: "text-red-700 bg-red-50 border-red-200" },
  };

  function BalanceBlock({ charged, paid }: { charged: number; paid: number }) {
    const diff = paid - charged;
    return (
      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-secondary rounded-xl p-5">
            <p className="text-muted-foreground text-sm mb-1">Всего начислено</p>
            <p className="text-2xl font-bold text-foreground">{charged.toLocaleString("ru-RU")} ₽</p>
          </div>
          <div className="bg-secondary rounded-xl p-5">
            <p className="text-muted-foreground text-sm mb-1">Всего оплачено</p>
            <p className="text-2xl font-bold text-foreground">{paid.toLocaleString("ru-RU")} ₽</p>
          </div>
        </div>
        <div className={`rounded-2xl border p-8 flex items-center gap-6 ${diff < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${diff < 0 ? "bg-red-100" : "bg-green-100"}`}>
            <Icon name={diff < 0 ? "AlertCircle" : "CheckCircle"} size={28} className={diff < 0 ? "text-red-600" : "text-green-600"} />
          </div>
          <div>
            <p className={`text-lg font-semibold mb-1 ${diff < 0 ? "text-red-700" : "text-green-700"}`}>{diff < 0 ? "Долг" : "Переплата"}</p>
            <p className={`text-4xl font-bold ${diff < 0 ? "text-red-600" : "text-green-600"}`}>{Math.abs(diff).toLocaleString("ru-RU")} ₽</p>
          </div>
        </div>
      </div>
    );
  }

  function ChargesList({ items }: { items: Charge[] }) {
    if (items.length === 0) return <p className="text-muted-foreground text-center py-10">Начислений нет</p>;
    return (
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {items.map((c) => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground text-base">{c.period || c.service}</p>
                {c.due_date && <p className="text-muted-foreground text-sm">Срок: {c.due_date}</p>}
              </div>
              <span className="font-semibold text-foreground text-lg">{c.amount.toLocaleString("ru-RU")} ₽</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function PaymentsList({ items }: { items: Payment[] }) {
    if (items.length === 0) return <p className="text-muted-foreground text-center py-10">Оплат нет</p>;
    return (
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {items.map((p) => (
            <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground text-base">{p.service}</p>
                <p className="text-muted-foreground text-sm">{p.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground text-lg">{p.amount.toLocaleString("ru-RU")} ₽</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-lg border ${statusLabel.paid.color}`}>Оплачено</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function SubTabs({ active, setActive }: { active: string; setActive: (v: "charges" | "payments" | "balance") => void }) {
    return (
      <div className="flex gap-2 mb-5 bg-secondary rounded-xl p-1 w-fit">
        {(["charges", "payments", "balance"] as const).map((key) => (
          <button key={key} onClick={() => setActive(key)}
            className={`px-5 py-2 rounded-lg text-base font-medium transition-colors ${active === key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {key === "charges" ? "Начисления" : key === "payments" ? "Оплаты" : "Долг / Переплата"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-golos">
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icon name="Home" size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">Мой Портал</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-base">Участок {user.plot}</span>
            <button onClick={onLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-base">
              <Icon name="LogOut" size={16} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="bg-white rounded-2xl border border-border p-6 mb-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
            <Icon name="User" size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Участок № {user.plot}</h2>
            <p className="text-muted-foreground text-base">Личный кабинет</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
          {([
            { key: "membership", label: "Членские взносы", icon: "Users" },
            { key: "electricity", label: "Электроэнергия", icon: "Zap" },
            { key: "notifications", label: "Уведомления", icon: "Bell" },
          ] as { key: typeof activeTab; label: string; icon: string }[]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-medium transition-colors ${activeTab === tab.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon name={tab.icon} size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {loading && <div className="text-center text-muted-foreground py-16">Загрузка данных...</div>}

        {!loading && activeTab === "membership" && (
          <div className="animate-slide-up">
            <SubTabs active={membershipSub} setActive={setMembershipSub} />
            {membershipSub === "charges" && <ChargesList items={membershipCharges} />}
            {membershipSub === "payments" && <PaymentsList items={membershipPayments} />}
            {membershipSub === "balance" && (
              <BalanceBlock
                charged={membershipCharges.reduce((s, c) => s + c.amount, 0)}
                paid={membershipPayments.reduce((s, p) => s + p.amount, 0)}
              />
            )}
          </div>
        )}

        {!loading && activeTab === "electricity" && (
          <div className="animate-slide-up">
            <SubTabs active={electricitySub} setActive={setElectricitySub} />
            {electricitySub === "charges" && <ChargesList items={electricityCharges} />}
            {electricitySub === "payments" && <PaymentsList items={electricityPayments} />}
            {electricitySub === "balance" && (
              <BalanceBlock
                charged={electricityCharges.reduce((s, c) => s + c.amount, 0)}
                paid={electricityPayments.reduce((s, p) => s + p.amount, 0)}
              />
            )}
          </div>
        )}

        {!loading && activeTab === "notifications" && (
          <div className="animate-slide-up bg-white rounded-2xl border border-border p-8 text-center text-muted-foreground">
            <Icon name="Bell" size={32} className="mx-auto mb-3 text-muted-foreground" />
            Уведомления появятся здесь после настройки рассылки
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Админ-панель ────────────────────────────────────────────────────────────

function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"plots" | "import">("plots");
  const [plots, setPlots] = useState<PlotSummary[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [plotDetail, setPlotDetail] = useState<{ charges: Charge[]; payments: Payment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API.data}?all=1`)
      .then((r) => r.json())
      .then((d) => setPlots(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function loadPlotDetail(plot: string) {
    setSelectedPlot(plot);
    setPlotDetail(null);
    const res = await fetch(`${API.data}?plot=${plot}`);
    const d = await res.json();
    setPlotDetail(d);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !fileInputRef.current) return;
    fileInputRef.current.value = "";
    setImporting(true);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(ev.target?.result as ArrayBuffer)));
        const res = await fetch(API.import, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: b64 }),
        });
        const d = JSON.parse(await res.text());
        setImportResult(d);
        // Обновить список участков
        const r2 = await fetch(`${API.data}?all=1`);
        const d2 = await r2.json();
        setPlots(Array.isArray(d2) ? d2 : []);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const filteredPlots = plots.filter((p) => p.plot.includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background font-golos">
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icon name="Home" size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">Мой Портал</span>
            <span className="bg-accent text-accent-foreground text-sm font-medium px-2.5 py-1 rounded-lg">Администратор</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-base">
            <Icon name="LogOut" size={16} />
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab("plots")}
            className={`px-6 py-2.5 rounded-lg text-base font-medium transition-colors ${activeTab === "plots" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <span className="flex items-center gap-2"><Icon name="LayoutGrid" size={18} />Все участки</span>
          </button>
          <button onClick={() => setActiveTab("import")}
            className={`px-6 py-2.5 rounded-lg text-base font-medium transition-colors ${activeTab === "import" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <span className="flex items-center gap-2"><Icon name="Upload" size={18} />Импорт оплат</span>
          </button>
        </div>

        {/* ВСЕ УЧАСТКИ */}
        {activeTab === "plots" && (
          <div className="animate-slide-up">
            {selectedPlot ? (
              <div>
                <button onClick={() => setSelectedPlot(null)} className="flex items-center gap-2 text-primary font-medium mb-5 hover:underline">
                  <Icon name="ArrowLeft" size={18} />
                  Назад к списку
                </button>
                <h2 className="text-2xl font-bold text-foreground mb-5">Участок № {selectedPlot}</h2>
                {!plotDetail ? (
                  <p className="text-muted-foreground">Загрузка...</p>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                      <div className="px-6 py-4 border-b border-border font-semibold text-foreground">Начисления</div>
                      {plotDetail.charges.length === 0 ? (
                        <p className="text-muted-foreground px-6 py-4">Нет данных</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {plotDetail.charges.map((c) => (
                            <div key={c.id} className="px-6 py-3 flex justify-between">
                              <div>
                                <p className="font-medium text-foreground">{c.period || c.service}</p>
                                <p className="text-sm text-muted-foreground">{c.service}</p>
                              </div>
                              <span className="font-semibold text-foreground">{c.amount.toLocaleString("ru-RU")} ₽</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                      <div className="px-6 py-4 border-b border-border font-semibold text-foreground">Оплаты</div>
                      {plotDetail.payments.length === 0 ? (
                        <p className="text-muted-foreground px-6 py-4">Нет данных</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {plotDetail.payments.map((p) => (
                            <div key={p.id} className="px-6 py-3 flex justify-between">
                              <div>
                                <p className="font-medium text-foreground">{p.service}</p>
                                <p className="text-sm text-muted-foreground">{p.date}</p>
                              </div>
                              <span className="font-semibold text-foreground">{p.amount.toLocaleString("ru-RU")} ₽</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex-1 relative">
                    <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Поиск по номеру участка..."
                      className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-base text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {loading ? (
                  <p className="text-muted-foreground text-center py-16">Загрузка...</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="grid grid-cols-7 px-5 py-3 bg-secondary text-sm font-semibold text-muted-foreground border-b border-border">
                      <div className="col-span-1">Участок</div>
                      <div className="col-span-1 text-right">Нач. взносы</div>
                      <div className="col-span-1 text-right">Опл. взносы</div>
                      <div className="col-span-1 text-right">Баланс взносы</div>
                      <div className="col-span-1 text-right">Нач. электро</div>
                      <div className="col-span-1 text-right">Опл. электро</div>
                      <div className="col-span-1 text-right">Баланс электро</div>
                    </div>
                    <div className="divide-y divide-border">
                      {filteredPlots.map((p) => (
                        <button key={p.plot} onClick={() => loadPlotDetail(p.plot)}
                          className="w-full grid grid-cols-7 px-5 py-3 hover:bg-accent/30 transition-colors text-left">
                          <div className="col-span-1 font-semibold text-primary text-base">№ {p.plot}</div>
                          <div className="col-span-1 text-right text-base">{p.charged_membership.toLocaleString("ru-RU")}</div>
                          <div className="col-span-1 text-right text-base">{p.paid_membership.toLocaleString("ru-RU")}</div>
                          <div className={`col-span-1 text-right font-semibold text-base ${p.balance_membership < 0 ? "text-red-600" : "text-green-600"}`}>
                            {p.balance_membership < 0 ? "−" : "+"}{Math.abs(p.balance_membership).toLocaleString("ru-RU")}
                          </div>
                          <div className="col-span-1 text-right text-base">{p.charged_electricity.toLocaleString("ru-RU")}</div>
                          <div className="col-span-1 text-right text-base">{p.paid_electricity.toLocaleString("ru-RU")}</div>
                          <div className={`col-span-1 text-right font-semibold text-base ${p.balance_electricity < 0 ? "text-red-600" : "text-green-600"}`}>
                            {p.balance_electricity < 0 ? "−" : "+"}{Math.abs(p.balance_electricity).toLocaleString("ru-RU")}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ИМПОРТ */}
        {activeTab === "import" && (
          <div className="animate-slide-up max-w-lg">
            <div className="bg-white rounded-2xl border border-border p-8 mb-5">
              <h3 className="text-xl font-semibold text-foreground mb-2">Импорт оплат из Excel</h3>
              <p className="text-muted-foreground text-base mb-6">
                Файл должен содержать колонки: <strong>дата</strong>, <strong>сумма</strong>, <strong>участок</strong>, <strong>услуга</strong>
              </p>
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground text-lg font-semibold py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Icon name="Upload" size={20} />
                {importing ? "Импортируем..." : "Выбрать файл Excel"}
              </button>
            </div>

            {importResult && (
              <div className={`rounded-2xl border p-6 ${importResult.imported > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon name={importResult.imported > 0 ? "CheckCircle" : "AlertCircle"} size={22}
                    className={importResult.imported > 0 ? "text-green-600" : "text-red-600"} />
                  <p className={`text-lg font-semibold ${importResult.imported > 0 ? "text-green-800" : "text-red-800"}`}>
                    Импортировано: {importResult.imported} записей
                  </p>
                </div>
                {importResult.skipped > 0 && (
                  <p className="text-muted-foreground text-base mb-2">Пропущено строк: {importResult.skipped}</p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-red-700 text-sm">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Главная точка входа ─────────────────────────────────────────────────────

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  function handleLogin(u: User) {
    setUser(u);
  }

  function handleLogout() {
    setUser(null);
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;
  if (user.is_first_login) return <SetPasswordScreen user={user} onDone={setUser} />;
  if (user.role === "admin") return <AdminPanel user={user} onLogout={handleLogout} />;
  return <UserCabinet user={user} onLogout={handleLogout} />;
}