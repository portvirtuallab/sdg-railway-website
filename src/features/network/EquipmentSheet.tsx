'use client';

import { Img } from '@/components/ui/Img';
import { useCatalogueState } from '@/features/quote/catalogue-client';
import { money } from '@/features/quote/format';

// Pictures of the loading units from the original Railway Equipment Fleet page, by UTI code.
const UTI_IMAGE: Record<string, string> = {
  'CONTAINER-20': 'IMG-097',
  'CONTAINER-40': 'IMG-098',
  'REEFER-40': 'IMG-102',
  TANK: 'IMG-103',
  'SWAP-BODY': 'IMG-104',
  'SEMI-TRAILER': 'IMG-105',
};

/** Loading units (UTI_TYPES) and the rail tariff per service and unit (TARIFFS). */
export function UtiCards() {
  const { catalogue: cat } = useCatalogueState();
  const services = cat.services.filter((s) => s.active);
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cat.utiTypes.map((u) => {
        const on = services.filter((s) =>
          cat.tariffs.some((t) => t.active && t.serviceId === s.id && t.utiType === u.code),
        );
        return (
          <li
            key={u.code}
            className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
          >
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-neutral-50 p-3">
              {UTI_IMAGE[u.code] ? (
                <Img id={UTI_IMAGE[u.code]!} className="max-h-full w-auto object-contain" />
              ) : (
                <span className="font-mono text-sm text-neutral-600">{u.code}</span>
              )}
            </div>
            <h3 className="text-railway-blue-900 mt-4 font-bold">{u.name}</h3>
            <p className="text-xs text-neutral-600">
              <span className="font-mono">{u.code}</span> · {u.category}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {u.maxGrossKg && (
                <div>
                  <dt className="text-neutral-600">Max load</dt>
                  <dd className="text-railway-blue-900 font-semibold">
                    {u.maxGrossKg.toLocaleString('en-GB')} kg
                  </dd>
                </div>
              )}
              {u.volumeM3 && (
                <div>
                  <dt className="text-neutral-600">Volume</dt>
                  <dd className="text-railway-blue-900 font-semibold">about {u.volumeM3} m³</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-neutral-600">Bookable on</dt>
                <dd className="text-railway-blue-900 font-semibold">
                  {on.length ? on.map((s) => s.name).join(', ') : 'No service yet'}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

export function TariffMatrix() {
  const { catalogue: cat } = useCatalogueState();
  const services = cat.services.filter((s) => s.active);
  const cur = cat.config.currency;
  return (
    <div
      className="overflow-x-auto rounded-2xl ring-1 ring-neutral-200"
      tabIndex={0}
      role="region"
      aria-label="Rail tariff table"
    >
      <table className="w-full min-w-[46rem] text-left text-sm">
        <caption className="sr-only">
          Rail freight per loading unit: fixed fee plus a rate per kilometre, with a minimum
        </caption>
        <thead className="bg-railway-blue-900 text-white">
          <tr>
            <th scope="col" className="px-3 py-3">
              Loading unit
            </th>
            {services.map((s) => (
              <th key={s.id} scope="col" className="px-3 py-3">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {cat.utiTypes.map((u) => (
            <tr key={u.code}>
              <th scope="row" className="text-railway-blue-900 px-3 py-2.5 font-semibold">
                {u.name}
              </th>
              {services.map((s) => {
                const t = cat.tariffs.find(
                  (x) => x.active && x.serviceId === s.id && x.utiType === u.code,
                );
                return (
                  <td key={s.id} className="px-3 py-2.5 tabular-nums">
                    {t ? (
                      <>
                        {money(t.fixedFee, cur)} + {money(t.ratePerKm, cur)}/km
                        <span className="block text-xs text-neutral-600">
                          minimum {money(t.minCharge, cur)}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-600">Not offered</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
