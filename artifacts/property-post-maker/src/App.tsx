import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  Copy,
  Download,
  FileText,
  House,
  Image as ImageIcon,
  ImagePlus,
  MapPin,
  Menu,
  Palette,
  PencilLine,
  RotateCcw,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  Upload,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type PropertyDetails = {
  property: string;
  location: string;
  price: string;
  highlights: string;
};

type VariationId = 'signature' | 'midnight' | 'terracotta' | 'sage';

type BrandAssets = {
  logo: string;
  banner: string;
  logoName: string;
  bannerName: string;
};

const initialDetails: PropertyDetails = {
  property: '4 BHK Luxury Villa, Ansal Golf City',
  location: 'Sushant Golf City, Lucknow',
  price: '₹2.5 Cr onwards',
  highlights: '3000 sq.ft · Corner plot · Ready to move',
};

const emptyBrandAssets: BrandAssets = {
  logo: '',
  banner: '',
  logoName: '',
  bannerName: '',
};

const variations: Record<
  VariationId,
  {
    label: string;
    description: string;
    start: string;
    mid: string;
    end: string;
    accent: string;
    soft: string;
    text: string;
    shadow: string;
  }
> = {
  signature: {
    label: 'Signature',
    description: 'Claret & gold',
    start: '#6b2b3d',
    mid: '#481c2d',
    end: '#28131e',
    accent: '#dfbd76',
    soft: '#f7e8cb',
    text: '#fbf4e6',
    shadow: 'rgba(87,28,43,.24)',
  },
  midnight: {
    label: 'Midnight',
    description: 'Ink & champagne',
    start: '#18334a',
    mid: '#102638',
    end: '#09151f',
    accent: '#d6bb7d',
    soft: '#e6edf0',
    text: '#f7f4ea',
    shadow: 'rgba(16,38,56,.28)',
  },
  terracotta: {
    label: 'Terracotta',
    description: 'Clay & saffron',
    start: '#984d36',
    mid: '#6b2e2c',
    end: '#351b24',
    accent: '#f0c16e',
    soft: '#fbe8d0',
    text: '#fff5e6',
    shadow: 'rgba(107,46,44,.26)',
  },
  sage: {
    label: 'Sage',
    description: 'Pine & linen',
    start: '#315246',
    mid: '#213c36',
    end: '#122a28',
    accent: '#d7c184',
    soft: '#e8efdf',
    text: '#f5f5e8',
    shadow: 'rgba(33,60,54,.28)',
  },
};

const fields = [
  { key: 'property', label: 'Property & type', hint: 'What are you listing?', icon: House },
  { key: 'location', label: 'Location', hint: 'City, neighbourhood or landmark', icon: MapPin },
  { key: 'price', label: 'Price', hint: 'Starting price or range', icon: Tag },
  { key: 'highlights', label: 'Highlights', hint: 'Separate details with  ·  ', icon: Sparkles },
] as const;

function xmlSafe(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function splitTitle(value: string) {
  const first = value.split(',')[0]?.trim() || 'Your next address';
  const words = first.split(/\s+/);
  if (words.length <= 3) return [first, ''];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
}

function Field({
  field,
  value,
  onChange,
}: {
  field: (typeof fields)[number];
  value: string;
  onChange: (value: string) => void;
}) {
  const Icon = field.icon;
  const isHighlights = field.key === 'highlights';
  return (
    <label className="group block" data-testid={`field-${field.key}`}>
      <span className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#806d64]">
        <span className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-[#b18a47]" strokeWidth={1.8} />
          {field.label}
        </span>
        <span className="font-medium normal-case tracking-normal text-[#a2928a]">{field.hint}</span>
      </span>
      {isHighlights ? (
        <textarea
          data-testid={`input-${field.key}`}
          aria-label={field.label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          className="editor-input min-h-[72px] w-full resize-none rounded-[10px] border border-[#ded5c9] bg-[#f8f5f0] px-4 py-3 text-[13px] font-medium leading-6 text-[#352d2a] placeholder:text-[#ad9e94]"
          placeholder="e.g. 3000 sq.ft · Corner plot · Ready to move"
        />
      ) : (
        <input
          data-testid={`input-${field.key}`}
          aria-label={field.label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="editor-input h-[49px] w-full rounded-[10px] border border-[#ded5c9] bg-[#f8f5f0] px-4 text-[13px] font-medium text-[#352d2a] placeholder:text-[#ad9e94]"
          placeholder={field.hint}
        />
      )}
    </label>
  );
}

function AssetUpload({
  kind,
  name,
  onUpload,
  onClear,
}: {
  kind: 'logo' | 'banner';
  name: string;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const inputId = `upload-${kind}`;
  const isLogo = kind === 'logo';
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[10px] border border-[#ded5c9] bg-[#f8f5f0] p-2.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[7px] border border-[#e2d7c9] bg-[#eee5d8]">
        {name ? (
          <span className="flex h-full w-full items-center justify-center bg-[#571c2b] text-[9px] font-bold uppercase tracking-[.08em] text-[#e7c98d]">
            {isLogo ? 'Logo' : 'Banner'}
          </span>
        ) : (
          <ImagePlus className="h-4 w-4 text-[#b18a47]" strokeWidth={1.7} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-[#4a3935]">{name || `${isLogo ? 'Logo mark' : 'Banner strip'}`}</p>
        <p className="mt-0.5 text-[10px] text-[#9b877c]">{name ? (isLogo ? 'Saved in this browser' : 'Saved · 1080 × 180 px recommended') : isLogo ? 'PNG, JPG or WebP' : 'Recommended 1080 × 180 px'}</p>
      </div>
      {name ? (
        <button type="button" onClick={onClear} className="pressable rounded-md p-2 text-[#806d64] hover:bg-[#eadfd2] hover:text-[#571c2b]" aria-label={`Remove ${kind}`} data-testid={`button-remove-${kind}`}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      ) : (
        <label htmlFor={inputId} className="pressable flex cursor-pointer items-center gap-1.5 rounded-md border border-[#d4c7b9] bg-[#fbf8f3] px-2.5 py-2 text-[9px] font-bold uppercase tracking-[.1em] text-[#624e45] hover:border-[#b18a47] hover:bg-[#eee6dc]">
          <Upload className="h-3.5 w-3.5" strokeWidth={1.8} /> Add
          <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = '';
          }} />
        </label>
      )}
    </div>
  );
}

function Home() {
  const [details, setDetails] = useState<PropertyDetails>(initialDetails);
  const [feedback, setFeedback] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [variation, setVariation] = useState<VariationId>('signature');
  const [brandAssets, setBrandAssets] = useState<BrandAssets>(() => {
    if (typeof window === 'undefined') return emptyBrandAssets;
    try {
      return { ...emptyBrandAssets, ...JSON.parse(window.localStorage.getItem('property-post-brand-assets') || '{}') };
    } catch {
      return emptyBrandAssets;
    }
  });

  const title = useMemo(() => splitTitle(details.property), [details.property]);
  const theme = variations[variation];
  const logoPresent = Boolean(brandAssets.logo);
  const locationWords = useMemo(() => {
    const parts = details.location.split(',').map((part) => part.trim()).filter(Boolean);
    return {
      area: parts[0] || 'Your neighbourhood',
      city: parts.slice(1).join(', ') || 'India',
    };
  }, [details.location]);
  const highlightList = useMemo(
    () => details.highlights.split('·').map((item) => item.trim()).filter(Boolean),
    [details.highlights],
  );

  const updateField = (key: keyof PropertyDetails, value: string) => {
    setDetails((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    try {
      window.localStorage.setItem('property-post-brand-assets', JSON.stringify(brandAssets));
    } catch {
      // Large uploads can exceed browser storage; the live preview still works for this session.
    }
  }, [brandAssets]);

  const notify = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2600);
  };

  const resetDetails = () => {
    setDetails(initialDetails);
    notify('Sample details restored');
  };

  const uploadAsset = (kind: 'logo' | 'banner', file: File) => {
    const maxSize = kind === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image file');
      return;
    }
    if (file.size > maxSize) {
      notify(`${kind === 'logo' ? 'Logo' : 'Banner'} must be under ${kind === 'logo' ? '2MB' : '5MB'}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setBrandAssets((current) => ({
        ...current,
        [kind]: result,
        [`${kind}Name`]: file.name,
      }));
      notify(`${kind === 'logo' ? 'Logo' : 'Banner'} added to your brand kit`);
    };
    reader.readAsDataURL(file);
  };

  const clearAsset = (kind: 'logo' | 'banner') => {
    setBrandAssets((current) => ({
      ...current,
      [kind]: '',
      [`${kind}Name`]: '',
    }));
    notify(`${kind === 'logo' ? 'Logo' : 'Banner'} removed`);
  };

  const buildSvg = () => {
    const safeTitle = title.filter(Boolean);
    const lineOne = xmlSafe(safeTitle[0] || 'Your next address');
    const lineTwo = xmlSafe(safeTitle[1] || '');
    const safeArea = xmlSafe(locationWords.area);
    const safeCity = xmlSafe(locationWords.city);
    const safePrice = xmlSafe(details.price || 'Price on request');
    const safeHighlights = xmlSafe(highlightList.join('  ·  ') || 'Details available on request');
    const safeLogo = brandAssets.logo ? xmlSafe(brandAssets.logo) : '';
    const safeBanner = brandAssets.banner ? xmlSafe(brandAssets.banner) : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      <defs>
         <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.start}"/><stop offset=".56" stop-color="${theme.mid}"/><stop offset="1" stop-color="${theme.end}"/></linearGradient>
         <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.accent}" stop-opacity=".58"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></linearGradient>
         <linearGradient id="bannerShade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${theme.start}" stop-opacity=".12"/><stop offset="1" stop-color="${theme.end}" stop-opacity=".95"/></linearGradient>
      </defs>
      <rect width="1080" height="1350" fill="url(#bg)"/>
      <circle cx="845" cy="230" r="340" fill="url(#sun)"/>
      <circle cx="860" cy="190" r="74" fill="#dfbd76" opacity=".83"/>
      <path d="M0 965 L310 590 L480 765 L670 445 L1080 920 V1350 H0Z" fill="#241520" opacity=".65"/>
      <path d="M0 1010 L310 650 L479 800 L669 505 L1080 952" fill="none" stroke="#e0bc75" stroke-opacity=".34" stroke-width="3"/>
      <path d="M0 1100 H1080 M0 1154 H1080 M0 1208 H1080" stroke="#e7c98d" stroke-opacity=".12" stroke-width="2"/>
      <path d="M105 0 V1350 M240 0 V1350 M375 0 V1350 M510 0 V1350 M645 0 V1350 M780 0 V1350 M915 0 V1350" stroke="#f2dbac" stroke-opacity=".06" stroke-width="2"/>
      <rect x="72" y="62" width="936" height="1" fill="#efdaaa" opacity=".4"/>
       <text x="72" y="46" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="18" letter-spacing="5">THE PROPERTY EDIT</text>
      <text x="1008" y="46" text-anchor="end" fill="#f4e6c9" font-family="Arial, sans-serif" font-size="17" letter-spacing="3">POST 01</text>
       ${safeLogo ? `<image href="${safeLogo}" x="72" y="82" width="210" height="52" preserveAspectRatio="xMinYMid meet"/>` : ''}
       ${safeLogo ? `<image href="${safeLogo}" x="72" y="82" width="210" height="52" preserveAspectRatio="xMinYMid meet"/>` : ''}
       <text x="72" y="${logoPresent ? 190 : 158}" fill="#eedcb8" font-family="Arial, sans-serif" font-size="18" letter-spacing="5">FOR THE LIFE YOU IMAGINE</text>
       <text x="72" y="${logoPresent ? 282 : 250}" fill="#fbf4e6" font-family="Georgia, serif" font-size="88" font-weight="bold">${lineOne}</text>
       <text x="72" y="${logoPresent ? 377 : 345}" fill="#fbf4e6" font-family="Georgia, serif" font-size="88" font-weight="bold">${lineTwo}</text>
       <rect x="72" y="${logoPresent ? 440 : 408}" width="56" height="4" fill="${theme.accent}"/>
       <text x="72" y="${logoPresent ? 494 : 462}" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="23" letter-spacing="2">${safeArea.toUpperCase()}</text>
       <text x="72" y="${logoPresent ? 530 : 498}" fill="#f7e8cb" font-family="Arial, sans-serif" font-size="23">${safeCity}</text>
       <rect x="72" y="645" width="936" height="110" rx="8" fill="${theme.accent}" opacity=".94"/>
       ${safeBanner ? `<image href="${safeBanner}" x="72" y="645" width="936" height="110" preserveAspectRatio="xMidYMid slice" opacity=".78"/><rect x="72" y="645" width="936" height="110" rx="8" fill="${theme.end}" opacity=".28"/>` : ''}
       <text x="105" y="693" fill="${theme.end}" font-family="Arial, sans-serif" font-size="15" font-weight="bold" letter-spacing="3">FEATURED LISTING</text>
       <text x="105" y="730" fill="${theme.end}" font-family="Georgia, serif" font-size="29" font-weight="bold">${safeBanner ? 'Book a private viewing' : 'Ready for your next viewing'}</text>
      <rect x="72" y="1062" width="936" height="1" fill="#efdaaa" opacity=".48"/>
       <text x="72" y="1113" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">ASKING FROM</text>
      <text x="72" y="1170" fill="#fff6e5" font-family="Georgia, serif" font-size="49" font-weight="bold">${safePrice}</text>
      <text x="72" y="1222" fill="#f5e7ca" font-family="Arial, sans-serif" font-size="18">${safeHighlights}</text>
      <rect x="72" y="1270" width="50" height="3" fill="#d8b16a"/>
      <text x="142" y="1280" fill="#fff5e2" font-family="Arial, sans-serif" font-size="18" letter-spacing="2">SUMIT SANGRAMPURKAR</text>
      <text x="1008" y="1280" text-anchor="end" fill="#d9b875" font-family="Arial, sans-serif" font-size="17" letter-spacing="3">INQUIRE</text>
    </svg>`;
  };

  const downloadPost = () => {
    const blob = new Blob([buildSvg()], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'property-post-sumit-sangrampurkar.svg';
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Your share-ready post is downloaded');
  };

  const copyDetails = async () => {
    const text = `${details.property}\n${details.location}\n${details.price}\n${details.highlights}\n\nContact: Sumit Sangrampurkar`;
    try {
      await navigator.clipboard.writeText(text);
      notify('Property details copied to clipboard');
    } catch {
      notify('Copy is unavailable in this browser');
    }
  };

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${details.property} · ${details.location}`,
          text: `${details.price} · Contact Sumit Sangrampurkar`,
        });
        notify('Post shared');
        return;
      } catch {
        return;
      }
    }
    await copyDetails();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    notify('Live preview is already up to date');
  };

  return (
    <div className="grain min-h-[100dvh] bg-[#f3efe8] text-[#352d2a]">
      <header className="relative z-30 border-b border-[#dfd5c8] bg-[#f3efe8]/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="pressable mr-3 rounded-md p-2 text-[#5d4c45] lg:hidden"
            aria-label="Toggle navigation"
            data-testid="button-toggle-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#571c2b] text-[#e3bd76] shadow-[0_4px_10px_rgba(87,28,43,.18)]">
              <span className="font-serif text-[21px] font-bold leading-none">P</span>
            </div>
            <div className="leading-none">
              <p className="font-serif text-[21px] font-bold tracking-[-0.02em] text-[#3e2930]">Property Post Maker</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.19em] text-[#9a8273]">A studio for standout listings</p>
            </div>
          </div>
          <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} absolute left-5 right-5 top-[68px] flex-col gap-2 rounded-xl border border-[#dfd5c8] bg-[#fbf8f3] p-3 shadow-lg lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`} aria-label="Main navigation">
            <a href="#studio" className="rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5e4b44] transition-colors hover:bg-[#ebe3d8] hover:text-[#571c2b]" data-testid="link-studio">Studio</a>
            <a href="#how-it-works" className="rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5e4b44] transition-colors hover:bg-[#ebe3d8] hover:text-[#571c2b]" data-testid="link-how-it-works">How it works</a>
            <span className="hidden h-5 w-px bg-[#d9cfc2] lg:block" />
            <span className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#9a8273]">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#b18a47]" /> No sign-up required
            </span>
          </nav>
          <button type="button" onClick={resetDetails} className="pressable hidden items-center gap-2 rounded-full border border-[#d7cabc] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e5b52] transition-colors hover:border-[#b18a47] hover:bg-[#ebe3d8] sm:flex" data-testid="button-reset-top">
            <RotateCcw className="h-3.5 w-3.5" /> Reset sample
          </button>
        </div>
      </header>

      <main id="studio" className="app-shell mx-auto max-w-[1440px] px-5 pb-14 pt-8 sm:px-8 sm:pt-12 lg:px-12 lg:pt-16">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-14 lg:flex-row lg:items-end">
          <div className="stagger-1 max-w-[760px]">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.23em] text-[#b18a47]"><span className="h-px w-7 bg-[#b18a47]" /> Property post / 01</p>
            <h1 className="font-serif text-[clamp(44px,6.3vw,88px)] font-semibold leading-[.87] tracking-[-0.055em] text-[#3d2930]">
              Make them pause.<br /><em className="font-medium text-[#8c6b39]">Make it home.</em>
            </h1>
          </div>
          <div className="stagger-2 flex max-w-[280px] items-start gap-3 text-[12px] leading-5 text-[#806d64] lg:mb-2">
            <PencilLine className="mt-0.5 h-4 w-4 shrink-0 text-[#b18a47]" strokeWidth={1.6} />
            <p>Four details in. One composed property story out — ready for your feed, your client, or your next viewing.</p>
          </div>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(360px,0.82fr)_minmax(500px,1.18fr)] lg:gap-[clamp(54px,8vw,132px)]">
          <section className="stagger-2" aria-labelledby="details-heading">
            <div className="mb-6 flex items-end justify-between border-b border-[#d8cdc0] pb-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b18a47]">01 / Input</p>
                <h2 id="details-heading" className="font-serif text-[31px] font-semibold leading-none tracking-[-0.03em] text-[#3d2930]">Set the scene</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a2928a]">Live editor</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-property-details">
              {fields.map((field) => (
                <Field key={field.key} field={field} value={details[field.key]} onChange={(value) => updateField(field.key, value)} />
              ))}
              <div className="mt-7 flex items-center gap-3 border-t border-[#d8cdc0] pt-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eadfce] text-[#7f6030]">
                  <UserRound className="h-4 w-4" strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9b8175]">Contact line added automatically</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#4a3935]">Sumit Sangrampurkar</p>
                </div>
                <Check className="ml-auto h-4 w-4 text-[#b18a47]" strokeWidth={2.5} />
              </div>
              <button type="submit" className="sr-only" aria-label="Update live preview" data-testid="button-update-preview">Update preview</button>
            </form>
            <div className="mt-8 border-t border-[#d8cdc0] pt-6" data-testid="brand-kit-section">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b18a47]"><ImagePlus className="h-3.5 w-3.5" strokeWidth={1.7} /> Brand kit</p>
                  <p className="text-[11px] leading-4 text-[#9b877c]">Add once. Reuse on every property post.</p>
                </div>
                <span className="text-[10px] font-medium text-[#a2928a]">Optional</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <AssetUpload kind="logo" name={brandAssets.logoName} onUpload={(file) => uploadAsset('logo', file)} onClear={() => clearAsset('logo')} />
                <AssetUpload kind="banner" name={brandAssets.bannerName} onUpload={(file) => uploadAsset('banner', file)} onClear={() => clearAsset('banner')} />
              </div>
            </div>
            <div className="mt-8 border-t border-[#d8cdc0] pt-6" data-testid="variation-section">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b18a47]"><Palette className="h-3.5 w-3.5" strokeWidth={1.7} /> Create a variation</p>
                  <p className="text-[11px] leading-4 text-[#9b877c]">Switch the mood without rewriting your listing.</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a2928a]">{theme.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(variations) as VariationId[]).map((id) => {
                  const option = variations[id];
                  const isSelected = id === variation;
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        setVariation(id);
                        notify(`${option.label} variation applied`);
                      }}
                      className={`variation-button ${isSelected ? 'variation-button-selected' : ''}`}
                      style={{ '--variation-start': option.start, '--variation-mid': option.mid } as CSSProperties}
                      data-testid={`button-variation-${id}`}
                      aria-pressed={isSelected}
                    >
                      <span className="variation-swatch" style={{ background: `linear-gradient(135deg, ${option.start}, ${option.mid} 58%, ${option.accent})` }} />
                      <span className="min-w-0 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-[.11em] text-[#4a3935]">{option.label}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-[#9b877c]">{option.description}</span>
                      </span>
                      {isSelected && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#b18a47]" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-[#9b877c]">Your brand kit and style choice stay saved in this browser.</p>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 rounded-[10px] border border-[#ded5c9] bg-[#eee6dc]/65 px-4 py-3 text-[11px] text-[#806d64]">
              <span className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-[#b18a47]" /> Keep it short. Let the layout do the talking.</span>
              <button type="button" className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#571c2b] underline decoration-[#b18a47] underline-offset-4 hover:text-[#8c6b39]" onClick={resetDetails} data-testid="button-reset-details">Use sample</button>
            </div>
          </section>

          <section className="stagger-3 order-first lg:order-none" aria-labelledby="preview-heading">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b18a47]">02 / Output</p>
                <h2 id="preview-heading" className="font-serif text-[31px] font-semibold leading-none tracking-[-0.03em] text-[#3d2930]">Your post, live</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#e9dfd2] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#806d64]">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#b18a47]" /> Updating
              </div>
            </div>
            <div className="grid items-center gap-8 xl:grid-cols-[minmax(300px,470px)_minmax(190px,1fr)]">
              <div className="preview-frame relative mx-auto w-full max-w-[470px] overflow-hidden rounded-[13px] border-[6px] border-[#fbf8f1]" style={{ background: theme.mid, boxShadow: `0 30px 70px ${theme.shadow}, 0 4px 12px rgba(40,24,22,.1)` }} data-testid="preview-post">
                <div className="relative aspect-[4/5] overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.start}, ${theme.mid} 56%, ${theme.end})` }}>
                  <div className="absolute -right-[30%] -top-[8%] h-[73%] w-[83%] rounded-full" style={{ background: `radial-gradient(circle at 38% 42%, ${theme.accent}c7, ${theme.accent}00 67%)` }} />
                  <div className="absolute right-[12%] top-[8%] h-[21%] w-[21%] rounded-full shadow-[0_0_55px_rgba(223,188,118,.26)]" style={{ background: `${theme.accent}d1` }} />
                  <div className="absolute inset-0 opacity-[.14]" style={{ backgroundImage: 'linear-gradient(rgba(236,208,157,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(236,208,157,.5) 1px, transparent 1px)', backgroundSize: '14% 14%' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-[49%]" style={{ background: `linear-gradient(135deg, transparent 0%, transparent 17%, ${theme.end}d9 17.2%, ${theme.end}d9 40%, transparent 40.2%), linear-gradient(45deg, transparent 0%, transparent 29%, ${theme.end}d1 29.2%, ${theme.end}d1 65%, transparent 65.2%)` }} />
                  <div className="absolute inset-x-[7%] top-[6%] border-t border-[#efdaaa]/40 pt-3">
                    <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-[.3em] text-[#e3bd76]"><span>The Property Edit</span><span className="text-[#f4e6c9]">Post 01</span></div>
                  </div>
                  {brandAssets.logo && <img src={brandAssets.logo} alt="Brand logo" className="absolute left-[7%] top-[8%] h-[8%] max-w-[34%] object-contain object-left" />}
                  <div className={`absolute left-[7%] right-[7%] ${logoPresent ? 'top-[19%]' : 'top-[15%]'}`}>
                    <p className="mb-4 text-[8px] font-bold uppercase tracking-[.28em] text-[#eedcb8]">For the life you imagine</p>
                    <div className="font-serif text-[clamp(28px,5.4vw,57px)] font-bold leading-[.87] tracking-[-.055em]" style={{ color: theme.text }} data-testid="text-preview-property">
                      <div>{title[0] || 'Your next address'}</div>
                      {title[1] && <div>{title[1]}</div>}
                    </div>
                    <div className="mt-5 h-[3px] w-8" style={{ background: theme.accent }} />
                    <p className="mt-4 text-[9px] font-bold uppercase tracking-[.18em]" style={{ color: theme.accent }} data-testid="text-preview-location-area">{locationWords.area}</p>
                    <p className="mt-1 text-[10px]" style={{ color: theme.soft }} data-testid="text-preview-location-city">{locationWords.city}</p>
                  </div>
                  <div className="absolute inset-x-[7%] top-[55%] h-[11%] overflow-hidden rounded-[5px] border border-[#f6dfac]/55 shadow-[0_5px_16px_rgba(0,0,0,.12)]" style={{ background: theme.accent }}>
                    {brandAssets.banner && <img src={brandAssets.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" />}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${theme.accent}f2, ${theme.accent}b8 56%, ${theme.end}9c)` }} />
                    <div className="relative flex h-full flex-col justify-center px-[5%]">
                      <p className="text-[7px] font-bold uppercase tracking-[.25em]" style={{ color: theme.end }}>Featured listing</p>
                      <p className="mt-1 font-serif text-[clamp(13px,2vw,22px)] font-bold leading-none" style={{ color: theme.end }}>{brandAssets.banner ? 'Book a private viewing' : 'Ready for your next viewing'}</p>
                    </div>
                  </div>
                  <div className="absolute inset-x-[7%] bottom-[6%] border-t border-[#efdaaa]/45 pt-4">
                    <p className="text-[8px] font-bold uppercase tracking-[.25em]" style={{ color: theme.accent }}>Asking from</p>
                    <p className="mt-1 font-serif text-[clamp(23px,4.1vw,43px)] font-bold leading-none tracking-[-.04em]" style={{ color: theme.text }} data-testid="text-preview-price">{details.price || 'Price on request'}</p>
                    <p className="mt-3 truncate text-[9px]" style={{ color: theme.soft }} data-testid="text-preview-highlights">{highlightList.join('  ·  ') || 'Details available on request'}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="h-[2px] w-7" style={{ background: theme.accent }} />
                      <span className="text-[8px] font-bold uppercase tracking-[.15em] text-[#fff5e2]" data-testid="text-preview-contact">Sumit Sangrampurkar</span>
                      <span className="ml-auto text-[8px] font-bold uppercase tracking-[.2em]" style={{ color: theme.accent }}>Inquire</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:pr-4">
                <div className="mb-2 hidden border-l border-[#d8cdc0] pl-5 xl:block">
                  <p className="font-serif text-[25px] font-semibold leading-[.95] tracking-[-.02em] text-[#4a3038]">A little<br />luxury,<br /><em className="font-medium text-[#9a743c]">ready to go.</em></p>
                  <p className="mt-4 text-[11px] leading-5 text-[#8b786d]">Designed in a rich claret and warm gold palette, so your listing feels as considered as the home itself.</p>
                </div>
                <button type="button" onClick={downloadPost} className="pressable flex h-12 items-center justify-center gap-2 rounded-[9px] px-4 text-[11px] font-bold uppercase tracking-[0.13em] text-[#f7ebd3] shadow-[0_8px_18px_rgba(87,28,43,.18)] transition-colors hover:brightness-110" style={{ background: theme.start }} data-testid="button-download-post">
                  <Download className="h-4 w-4" strokeWidth={1.8} /> Download creative
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={copyDetails} className="pressable flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#d4c7b9] bg-[#fbf8f3] text-[10px] font-bold uppercase tracking-[0.1em] text-[#624e45] transition-colors hover:border-[#b18a47] hover:bg-[#eee6dc]" data-testid="button-copy-details">
                    <Copy className="h-3.5 w-3.5" /> Copy text
                  </button>
                  <button type="button" onClick={sharePost} className="pressable flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#d4c7b9] bg-[#fbf8f3] text-[10px] font-bold uppercase tracking-[0.1em] text-[#624e45] transition-colors hover:border-[#b18a47] hover:bg-[#eee6dc]" data-testid="button-share-post">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                </div>
                <p className="mt-1 flex items-center justify-center gap-2 text-[10px] text-[#9b877c]"><ImageIcon className="h-3.5 w-3.5" /> Downloaded as an editable SVG — crisp at every size</p>
              </div>
            </div>
          </section>
        </div>

        <section id="how-it-works" className="mt-20 border-t border-[#d8cdc0] pt-7 sm:mt-28 sm:pt-9" aria-label="How it works">
          <div className="grid gap-8 sm:grid-cols-[1fr_2fr] lg:grid-cols-[.8fr_2.2fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b18a47]">A quicker way to list</p>
              <p className="mt-2 font-serif text-[23px] font-semibold leading-none tracking-[-.02em] text-[#4a3038]">From blank page<br />to beautiful post.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { icon: FileText, number: '01', title: 'Add the essentials', body: 'Four details are all the layout needs.' },
                { icon: ImageIcon, number: '02', title: 'Watch it compose', body: 'Your visual updates with every keystroke.' },
                { icon: ArrowUpRight, number: '03', title: 'Share with confidence', body: 'Download it clean, then make it yours.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.number} className="flex gap-3 border-l border-[#d8cdc0] pl-4" data-testid={`step-${item.number}`}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#b18a47]" strokeWidth={1.7} />
                    <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9b8175]">{item.number}</p><p className="mt-1 text-[12px] font-bold text-[#4a3935]">{item.title}</p><p className="mt-1 text-[11px] leading-4 text-[#89776d]">{item.body}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {feedback && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#3d2930] px-4 py-3 text-[11px] font-semibold text-[#f7ebd3] shadow-[0_12px_30px_rgba(61,41,48,.28)]" data-testid="status-feedback">
          <Check className="h-4 w-4 text-[#dfbd76]" strokeWidth={2.4} /> {feedback}
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;