'use client';

// Client Component hone ki wajah se yeh formatting BROWSER mein hoti hai, server pe nahi.
// timeZone explicitly specify NAHI kiya — isliye Intl API khud visitor ke apne
// system/browser timezone ka use karta hai. Isse India ka doctor-slot US/UK/wherever
// ke friend ko unke apne local time mein dikhega, automatically.

type Props = {
  startTime: string; // ISO string, UTC
  endTime: string;   // ISO string, UTC
};

export default function SlotTime({ startTime, endTime }: Props) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const dateLabel = start.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const startLabel = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="font-medium">{dateLabel}</div>
      <div className="text-gray-500 text-sm">
        {startLabel} – {endLabel}
      </div>
    </>
  );
}
