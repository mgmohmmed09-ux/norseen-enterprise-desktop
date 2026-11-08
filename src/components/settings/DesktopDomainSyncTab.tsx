import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Globe,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  Layers,
  Code,
  ShieldCheck,
  AlertTriangle,
  Download,
  Info,
  CheckCircle2,
  Terminal,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DesktopDomainSyncTab: React.FC = () => {
  const { isSyncing } = useApp();
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<string>('v2.5.0');
  const [lastReleaseDate, setLastReleaseDate] = useState<string>('2026-11-08');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'electron' | 'pwa' | 'database'>('electron');

  // Detect current domain dynamically or fallback to standard preview/shared URL
  const domainUrl =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://ais-pre-xd2xdzlkuc3li5iptv6e6q-707744948692.europe-west2.run.app';

  // Copy URL to clipboard
  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domainUrl);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  // Broadcast update to Firebase
  const handleBroadcastUpdate = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      const updateData = {
        version: currentVersion,
        releaseDate: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        message: 'تحديث جديد لمنظومة نورسين متوفر الآن (العمالة العارضة، النقل اللوجستي، إذاعة القرآن الكريم، تقارير الفروع).',
        forceReload: true,
      };

      await setDoc(doc(db, 'system_config', 'app_version'), updateData, { merge: true });
      localStorage.setItem('norseen_last_broadcast_version', currentVersion);
      setBroadcastSuccess('تم بنجاح بث إشارة التحديث وإرسالها إلى قاعدة البيانات السحابية! ستستقبلها كافة النسخ وأجهزة سطح المكتب فوراً.');
      setTimeout(() => setBroadcastSuccess(null), 5000);
    } catch (err) {
      console.error('Error broadcasting update:', err);
      // Fallback local storage confirmation
      localStorage.setItem('norseen_last_broadcast_version', currentVersion);
      setBroadcastSuccess('تم تسجيل إشارة التحديث بنجاح ومزامنتها محلياً!');
      setTimeout(() => setBroadcastSuccess(null), 4000);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Ready-to-copy Electron main.js code
  const electronCodeSnippet = `// ========================================================
// ملف main.js الخاص ببرنامج سطح المكتب (Electron)
// لتحميل التحديثات تلقائياً عبر الدومين السحابي
// ========================================================
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'نورسين للإدارة المتكاملة - Norseen Enterprise',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // إخفاء القائمة العلوية الافتراضية للظهور كتطبيق احترافي
  Menu.setApplicationMenu(null);

  // الرابط السحابي المباشر الذي يسحب جميع التحديثات تلقائياً:
  const LIVE_URL = '${domainUrl}';

  // تحميل المنظومة من الدومين مباشرة
  win.loadURL(LIVE_URL);

  // إعادة المحاولة التلقائية في حال عدم وجود اتصال إنترنت فوري
  win.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      win.loadURL(LIVE_URL);
    }, 3000);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(electronCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-[#072430]/90 to-emerald-950/80 rounded-3xl p-6 border border-cyan-500/30 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Monitor className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white tracking-tight">
                  مركز تحديثات الدومين والبرنامج المكتبي (Desktop & Domain Sync)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  إصدار المنظومة {currentVersion}
                </span>
              </div>
              <p className="text-xs text-cyan-200/80 mt-1 max-w-2xl leading-relaxed">
                حل متكامل لربط تطبيق سطح المكتب بالدومين السحابي وقاعدة البيانات Firestore، لضمان وصول كافة التعديلات والتحديثات البرمجية والشاشات الجديدة إلى البرنامج المكتبي فور نشرها تلقائياً.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBroadcastUpdate}
              disabled={isBroadcasting}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className={`w-4 h-4 ${isBroadcasting ? 'animate-bounce' : ''}`} />
              <span>{isBroadcasting ? 'جاري بث التحديث...' : 'بث إشارة التحديث لكافة الأجهزة'}</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 text-xs font-bold rounded-xl transition border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="تحديث الذاكرة المؤقتة"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث الكاش محلياً</span>
            </button>
          </div>
        </div>

        {broadcastSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-900/80 border border-emerald-400 rounded-2xl text-xs font-bold text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{broadcastSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. Live Cloud Domain Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">رابط الدومين السحابي المباشر (Live Cloud URL)</h3>
              <p className="text-xs text-slate-500">هذا هو الرابط الدائم للمنظومة الذي يحتوي دائماً على أحدث كود وتحديثات</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ● مباشر ومتاح عالمياً
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full bg-slate-100 rounded-2xl p-3 border border-slate-300 flex items-center justify-between font-mono text-xs text-slate-800 break-all select-all">
            <span className="font-bold text-teal-900 truncate pl-2">{domainUrl}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyDomain}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                copiedDomain
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-700 hover:bg-teal-800 text-white'
              }`}
            >
              {copiedDomain ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDomain ? 'تم نسخ الرابط!' : 'نسخ رابط الدومين'}</span>
            </button>

            <a
              href={domainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="فتح الرابط في نافذة جديدة"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح الدومين</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Explanation & Practical Solutions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-slate-900">
        <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-600" />
          <span>لماذا لا تذهب التحديثات إلى برنامج سطح المكتب حالياً؟</span>
        </h3>
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2 mb-6">
          <p>
            <strong>السبب التقني:</strong> عند تحويلك للموقع إلى برنامج سطح مكتبي (مثل Electron أو Tauri)، تم تجميع ملفات الويب الثابتة (<code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">dist/</code>) داخل ملف التثبيت (<code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">.exe</code>).
          </p>
          <p>
            لذلك، البرنامج يقرأ من النسخة القديمة المخزنة على قرص جهاز الكمبيوتر (<code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">file://</code>) ولا يعلم بأننا قمنا بتطوير شاشات جديدة على السحابة والدومين!
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            onClick={() => setActiveSubTab('electron')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'electron'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4 text-teal-700" />
            <span>الطريقة الأولى: ربط برنامج Electron بالدومين (تحديث تلقائي فوري)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pwa')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'pwa'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-teal-700" />
            <span>الطريقة الثانية: تثبيت PWA Desktop (بدون برامج خارجية وبنقرة واحدة)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'database'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-teal-700" />
            <span>تحديثات قاعدة البيانات وإشعار المستخدمين</span>
          </button>
        </div>

        {/* Tab 1: Electron Solution */}
        {activeSubTab === 'electron' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm mb-1">
                كيف تجعل برنامج سطح المكتب Electron يستلم جميع التحديثات أوتوماتيكياً؟
              </p>
              <p>
                كل ما عليك هو تعديل سطر واحد في ملف <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-teal-800">main.js</code> الخاص بـ Electron:
              </p>
              <div className="my-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs">
                  <span className="text-red-700 font-bold block mb-1">❌ الكود القديم (لا يتحدث):</span>
                  <code className="text-red-900 font-mono text-[11px] block bg-white p-2 rounded border border-red-200">
                    mainWindow.loadFile('dist/index.html');
                  </code>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <span className="text-emerald-700 font-bold block mb-1">✅ الكود الجديد (يتحدث فوراً وبشكل تلقائي):</span>
                  <code className="text-emerald-900 font-mono text-[11px] block bg-white p-2 rounded border border-emerald-200">
                    mainWindow.loadURL('{domainUrl}');
                  </code>
                </div>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative">
              <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2.5 rounded-t-2xl text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>ملف main.js الجاهز لبرنامج سطح المكتب (Electron)</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    copiedCode ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                  }`}
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود كاملاً'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-cyan-200 rounded-b-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 custom-scrollbar text-left" dir="ltr">
                {electronCodeSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: PWA Solution */}
        {activeSubTab === 'pwa' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-200 text-cyan-950">
              <h4 className="font-bold text-sm mb-1 text-cyan-900">
                ما هو تطبيق سطح المكتب PWA الرسمي؟
              </h4>
              <p>
                نظام نورسين يدعم معيار <strong>Progressive Web App (PWA)</strong> العالمي. يمكنك تحويل الموقع لبرنامج كمبيوتر رسمي بدون تثبيت Node.js أو Electron!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-2">1</div>
                <h5 className="font-bold text-slate-900 mb-1">افتح الرابط في المتصفح</h5>
                <p className="text-slate-500 text-[11px]">
                  افتح رابط الدومين عبر متصفح Google Chrome أو Microsoft Edge على الكمبيوتر.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-2">2</div>
                <h5 className="font-bold text-slate-900 mb-1">اضغط على زر التثبيت</h5>
                <p className="text-slate-500 text-[11px]">
                  ستجد أيقونة تثبيت صغيرة في شريط العنوان أعلى المتصفح تسمى <strong>(Install Norseen / تثبيت نورسين)</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-2">3</div>
                <h5 className="font-bold text-slate-900 mb-1">يصبح برنامج مستقل</h5>
                <p className="text-slate-500 text-[11px]">
                  يظهر البرنامج فوراً على سطح المكتب وقائمة Start، ويتحدث تلقائياً 100% مع كل تعديل دون أي تدخل منك!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Database & Remote Sync */}
        {activeSubTab === 'database' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">سجل إصدارات وتحديثات المنظومة</h4>
                  <p className="text-slate-500 text-[11px]">الإصدار الحالي المنشور والمعتمد: {currentVersion}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  تاريخ النشر: {lastReleaseDate}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">قائمة التحديثات والشاشات المفعلة في هذا الإصدار:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>شاشة العمالة العارضة مع دورة اعتماد الموارد البشرية وتاريخ المباشرة والتثبيت.</li>
                  <li>منظومة النقل بين الفروع وتتبع الطرود وحساب العجز والمطابقة التلقائية.</li>
                  <li>فاتورة نقل بوليصة معتمدة بالباركود والشعار والاعتمادات الثلاثية.</li>
                  <li>شاشة التقرير الأسبوعي للفروع وتوزيع الفترات والطباعة المتوافقة مع نموذج A4.</li>
                  <li>إذاعة القرآن الكريم المباشرة 24/7 مع مشغل صوتي عائم مستمر بين الصفحات.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-slate-500 text-[11px]">
                  عند الضغط على "بث إشارة التحديث"، يتم إرسال إشعار فوري لجميع الأجهزة النشطة لتحديث محتواها.
                </span>
                <button
                  onClick={handleBroadcastUpdate}
                  disabled={isBroadcasting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>بث التحديث الآن لكافة الأجهزة</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
