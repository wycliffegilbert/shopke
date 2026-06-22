'use client';
import { useState } from 'react';
import { X, MessageCircle, ShoppingBag, HelpCircle, Truck, RotateCcw } from 'lucide-react';

const PHONE = '254700000000'; // ← replace with your actual WhatsApp number
const QUICK_MESSAGES = [
  { icon: <ShoppingBag size={15} />, label: 'Product enquiry', message: 'Hi ShopKE! I have a question about a product.' },
  { icon: <Truck size={15} />, label: 'Track my order', message: 'Hi ShopKE! I\'d like to track my order.' },
  { icon: <RotateCcw size={15} />, label: 'Return / Refund', message: 'Hi ShopKE! I need help with a return or refund.' },
  { icon: <HelpCircle size={15} />, label: 'General support', message: 'Hi ShopKE! I need some help.' },
];

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  const openChat = (message: string) => {
    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Popup card */}
        {open && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-[#25D366] px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">ShopKE Support</p>
                    <p className="text-white/80 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                      Online now
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2.5">
                <p className="text-white text-xs leading-relaxed">
                  👋 Hi there! How can we help you today? Choose a topic below or type your own message.
                </p>
              </div>
            </div>

            {/* Quick messages */}
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Quick Options</p>
              {QUICK_MESSAGES.map(q => (
                <button
                  key={q.label}
                  onClick={() => openChat(q.message)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-[#25D366]/30 transition-all text-left group">
                  <div className="w-8 h-8 bg-[#25D366]/10 group-hover:bg-[#25D366]/20 rounded-lg flex items-center justify-center text-[#25D366] flex-shrink-0 transition-colors">
                    {q.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{q.label}</span>
                </button>
              ))}

              <button
                onClick={() => openChat('Hi ShopKE!')}
                className="w-full mt-1 bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Start a Conversation
              </button>
            </div>
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
          aria-label="Chat on WhatsApp">
          {open ? (
            <X size={22} />
          ) : (
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          )}
        </button>

        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
        )}
      </div>
    </>
  );
}
