"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { formatGhs } from "@/lib/shop";
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import {
  useLocationCities,
  useLocationRegions,
  useLocationNeighborhoods,
  useNeighborhoodOptions,
  useBusStations,
} from "@/hooks/queries/useLocations";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-900";

const STORAGE_KEY = "eazworld_shipping_addresses";
// Saved addresses live in their own collection; the server caps a customer at 3
// (controllers/addressController.js MAX_ADDRESSES). This constant also bounds
// the signed-out localStorage fallback.
const MAX_SAVED = 3;

function pickSavedAddresses() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((a) => a && (a.street || a.neighborhood || a.city || a.region))
      .slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

function persistLocal(address) {
  try {
    const current = pickSavedAddresses();
    const line = [address.street, address.neighborhood, address.city, address.region]
      .map((p) => (p || "").trim())
      .filter(Boolean)
      .join(", ");
    if (!line) return;
    const key = `${address.street}|${address.neighborhood}|${address.city}|${address.region}`;
    const next = [
      address,
      ...current.filter(
        (a) =>
          `${a.street}|${a.neighborhood}|${a.city}|${a.region}` !== key,
      ),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_SAVED)));
  } catch {
    // localStorage unavailable — addresses just won't be saved
  }
}

function addressLine(a) {
  return [a.street, a.neighborhood, a.city, a.region]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  // Customer + destination. `region` and `city` are picked from API-driven
  // dropdowns (T80 E2); `neighborhood` is filtered by city; for outside
  // Greater Accra, the customer then picks a `pickupLocationId`.
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    street: "",
    region: "",
    city: "",
    neighborhood: "",
  });
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  // The area id carried BY THE ADDRESS. When a saved address supplies it we use
  // it directly — no name matching, no re-picking — which is what makes
  // selecting an address enough to price the delivery.
  const [addressNeighborhoodId, setAddressNeighborhoodId] = useState("");

  // Methods + quote come from the existing shipping API; we now also pass
  // `region` + `pickupLocationId` so the backend can pick the right
  // formula and bind the cartHash to the exact fulfilment context.
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [shippingQuote, setShippingQuote] = useState(null);
  // A refused quote must be visible. Swallowing the error and showing an empty
  // fee is how a pricing failure turns into a silently wrong (or missing)
  // charge that nobody reports.
  const [quoteError, setQuoteError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Address modal state — uses the same cascade in a self-contained form.
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    label: "",
    street: "",
    region: "",
    city: "",
    neighborhood: "",
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Cities for the *current* customer (not the modal). Fetched reactively:
  // only once a region is set. The neighbourhood the buyer delivers to is
  // chosen in the address modal, and priced via useNeighborhoodOptions below.
  const citiesQuery = useLocationCities(customer.region);
  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data]);

  // The priced delivery areas, carrying the id the quote needs. Keyed by
  // lower-cased name so the picker's value maps straight onto an id.
  const neighborhoodOptionsQuery = useNeighborhoodOptions(customer.city);
  // Memoised so the `?? []` fallback doesn't hand a fresh array to the lookup
  // map on every render and re-run the quote effect that depends on it.
  const neighborhoodOptions = useMemo(
    () => neighborhoodOptionsQuery.data ?? [],
    [neighborhoodOptionsQuery.data],
  );
  const neighborhoodIdByName = useMemo(() => {
    const map = new Map();
    for (const n of neighborhoodOptions) {
      map.set(String(n.name).trim().toLowerCase(), n.id);
    }
    return map;
  }, [neighborhoodOptions]);

  // The selected city resolves to an inAccraCore flag — that drives whether
  // we show delivery methods (Greater Accra) or the bus-station pickup
  // selector (outside).
  const selectedCityEntry = useMemo(
    () => cities.find((c) => c.city === customer.city) || null,
    [cities, customer.city],
  );
  const inAccraCore = Boolean(selectedCityEntry?.inAccraCore);

  // Bus-station pickup list for outside-Greater-Accra cities. Only fetched
  // when we actually need it (region + city set, inAccraCore === false).
  const busStationsQuery = useBusStations(
    inAccraCore ? "" : customer.region,
    inAccraCore ? "" : customer.city,
  );
  const busStations = busStationsQuery.data ?? [];

  // ── Saved addresses hydration ───────────────────────────────────────────
  useEffect(() => {
    if (user) {
      api
        .get("/addresses")
        .then((r) => setSavedAddresses(Array.isArray(r.data) ? r.data : []))
        .catch(() => setSavedAddresses(pickSavedAddresses()));
    } else {
      setSavedAddresses(pickSavedAddresses());
    }
  }, [user]);

  // When the city changes, the inAccraCore flag may flip too. We reset the
  // quote + method + pickup whenever the fulfilment context changes — the
  // old quote is no longer valid for the new context.
  useEffect(() => {
    setSelectedNeighborhood("");
    setMethods([]);
    setSelectedMethod("");
    setShippingQuote(null);
    setAddressNeighborhoodId("");
    if (inAccraCore) setPickupLocationId("");
  }, [customer.city, customer.region, inAccraCore]);

  // When a neighborhood is picked (Greater Accra only), normalise it to
  // lowercase so it matches the DB-stored shape used by the calculator.
  useEffect(() => {
    if (inAccraCore && customer.neighborhood) {
      setSelectedNeighborhood(customer.neighborhood.trim().toLowerCase());
    } else {
      setSelectedNeighborhood("");
    }
  }, [customer.neighborhood, inAccraCore]);

  // Methods fetch — triggered for Greater Accra (in-core) only. Outside
  // Greater Accra the only fulfilment method is bus_station_pickup, so the
  // UI renders a single hard-coded option + a pickup selector.
  useEffect(() => {
    if (!customer.region || !customer.city) return;
    if (!inAccraCore) {
      // Outside Greater Accra: bus_station_pickup is the only method.
      setMethods([
        {
          id: "bus_station_pickup",
          name: "Bus Station Pickup",
          speed: "standard",
          available: true,
          estimatedDays: null,
          isPickup: true,
        },
      ]);
      setSelectedMethod((prev) => (prev === "bus_station_pickup" ? prev : "bus_station_pickup"));
      return;
    }
    if (!selectedNeighborhood) return;
    setSelectedMethod("");
    setShippingQuote(null);
    // Send the cart context too: without it the endpoint cannot know the order
    // qualifies for free delivery, and the price it returns would be replaced a
    // moment later by the quote — the fee visibly changing under the customer.
    const cartSubtotal = items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
    const cartWeightKg = items.reduce((sum, i) => sum + (Number(i.weight) || 0) * i.qty, 0);
    const params = new URLSearchParams({
      city: customer.city,
      neighborhood: selectedNeighborhood,
      region: customer.region,
      subtotal: String(cartSubtotal),
      weightKg: String(cartWeightKg),
    });
    const areaId =
      addressNeighborhoodId ||
      neighborhoodIdByName.get(String(selectedNeighborhood).trim().toLowerCase());
    if (areaId) params.set("neighborhoodId", areaId);
    api
      .get(`/shipping/methods?${params.toString()}`)
      .then((r) => {
        // Owner decision (2026-08-30): keep every method in the list, including
        // ones that are not bookable right now. Express is sold as one of three
        // standing options (Standard, Next Day, Express) and silently dropping
        // it after the 5pm cutoff makes the storefront look broken. It is now
        // rendered disabled with the server's reason instead of disappearing.
        const available = (r.data?.methods || []);
        // Slowest first. Any speed missing from this map sorted to the bottom,
        // which put "Courier — Next Day" below Express and out of price order.
        // `in_house_delivery` is an id, not a speed — it carries speed
        // "standard", so keying this map by speed alone tied it with Courier
        // Standard instead of pinning it to the top. Rank by id first, then
        // fall back to speed.
        const speedOrder = { standard: 1, next_day: 2, express: 3, same_day: 4 };
        const idOrder = { in_house_delivery: 0, bus_station_pickup: 0 };
        const rank = (m) => idOrder[m.id] ?? speedOrder[m.speed] ?? 9;
        available.sort((a, b) => rank(a) - rank(b));
        setMethods(available);
        const selectable = available.filter((m) => m.available !== false);
        const defaultMethod =
          selectable.find((m) => m.id === "in_house_delivery") || selectable[0];
        if (defaultMethod) setSelectedMethod(defaultMethod.id);
      })
      .catch(() => setMethods([]));
  }, [customer.region, customer.city, selectedNeighborhood, inAccraCore, items, addressNeighborhoodId, neighborhoodIdByName]);

  // Auto-quote. For bus_station_pickup we require a pickupLocationId; for
  // delivery we require a neighborhood. The backend recomputes everything
  // server-side; the quoteId it returns is the only thing we hand to
  // checkout, and the server re-validates via cartHash.
  useEffect(() => {
    if (!selectedMethod || items.length === 0) {
      setShippingQuote(null);
      return;
    }
    if (inAccraCore && !selectedNeighborhood) {
      setShippingQuote(null);
      return;
    }
    if (!inAccraCore && !pickupLocationId) {
      setShippingQuote(null);
      return;
    }
    const productItems = items
      .filter((i) => i._id)
      .map((i) => ({ productId: i._id, quantity: i.qty }));
    if (productItems.length === 0) {
      setShippingQuote(null);
      return;
    }
    let cancelled = false;
    const body = {
      city: customer.city,
      region: customer.region,
      method: selectedMethod,
      items: productItems,
    };
    if (inAccraCore) {
      body.neighborhood = selectedNeighborhood;
      // Prefer the id the address itself carries — that is the whole point of
      // storing it. The name lookup is the fallback for addresses saved before
      // the field existed.
      const id =
        addressNeighborhoodId ||
        neighborhoodIdByName.get(String(selectedNeighborhood).trim().toLowerCase());
      if (id) body.neighborhoodId = id;
    } else {
      body.pickupLocationId = pickupLocationId;
    }
    setQuoteError("");
    api
      .post("/shipping/quote", body)
      .then((r) => {
        if (!cancelled) setShippingQuote(r.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setShippingQuote(null);
        setQuoteError(
          errorMessage(err, "We could not work out delivery for that address. Please pick another area or contact us."),
        );
      });
    return () => { cancelled = true; };
  }, [selectedMethod, customer.region, customer.city, selectedNeighborhood, pickupLocationId, items, inAccraCore, neighborhoodIdByName, addressNeighborhoodId]);

  const selectedMethodInfo = methods.find((m) => m.id === selectedMethod);
  const quoteFee = shippingQuote ? (shippingQuote.shippingFee || 0) : 0;
  const deliveryFee = shippingQuote ? quoteFee : (selectedMethodInfo?.indicativeFee || 0);
  // When the server refused to quote, there is no delivery fee to show. Falling
  // back to the indicative figure here would put a number in the total that the
  // server has explicitly declined to charge — a plausible price standing in
  // for a real failure, which is the one thing a checkout total must never do.
  const total = quoteError ? subtotal : subtotal + deliveryFee;

  const openModal = () => {
    setModalForm({ label: "", street: "", region: "", city: "", neighborhood: "" });
    setModalError("");
    setModalOpen(true);
  };

  const selectSavedAddress = (addr) => {
    setCustomer((c) => ({
      ...c,
      street: addr.street || "",
      region: addr.region || "",
      city: addr.city || "",
      neighborhood: addr.neighborhood || "",
    }));
    // Addresses saved before this field existed have no id; the name lookup
    // below still resolves those, so old addresses keep working.
    setAddressNeighborhoodId(addr.neighborhoodId ? String(addr.neighborhoodId) : "");
  };

  const saveModalAddress = async () => {
    setModalError("");
    const neighborhoodIdForSave =
      neighborhoodIdByName.get(modalForm.neighborhood.trim().toLowerCase()) || "";
    const saved = {
      label: modalForm.label.trim(),
      street: modalForm.street.trim(),
      region: modalForm.region,
      city: modalForm.city,
      neighborhood: modalForm.neighborhood.trim(),
      // Stored ON the address so re-selecting it prices the delivery without
      // the customer touching the form again.
      neighborhoodId: neighborhoodIdForSave,
    };
    if (!addressLine(saved)) {
      setModalError("Enter at least a region, city, neighborhood, or street address.");
      return;
    }
    setModalSaving(true);
    try {
      if (user) {
        const sRes = await api.post("/addresses", saved);
        setSavedAddresses((prev) => {
          const without = prev.filter((a) => addressLine(a) !== addressLine(saved));
          return [sRes.data, ...without];
        });
      } else {
        persistLocal(saved);
        setSavedAddresses(pickSavedAddresses());
      }
      setCustomer((c) => ({
        ...c,
        street: saved.street,
        region: saved.region,
        city: saved.city,
        neighborhood: saved.neighborhood,
      }));
      setAddressNeighborhoodId(saved.neighborhoodId || "");
      setModalOpen(false);
    } catch (err) {
      setModalError(errorMessage(err, "Could not save the address. Please try again."));
    } finally {
      setModalSaving(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError("");
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    if (!customer.region || !customer.city) {
      setError("Please select a region and city for delivery.");
      return;
    }
    if (inAccraCore && !selectedNeighborhood) {
      setError("Please select a neighborhood for delivery.");
      return;
    }
    if (!inAccraCore && !pickupLocationId) {
      setError("Please select a bus-station pickup location.");
      return;
    }
    if (methods.length > 0 && !selectedMethod) {
      setError("Please select a delivery method.");
      return;
    }
    // Don't let an order through on a refused quote. The server would reject it
    // anyway, but the customer deserves to know before pressing Place Order.
    if (quoteError) {
      setError(quoteError);
      return;
    }

    setLoading(true);
    try {
      // T127 — sanitise ON SUBMIT, never on keystroke. That is the documented
      // rule (STYLE_GUIDE.md, CLAUDE.md) and the reason typing is not disrupted:
      // stripping characters as someone types fights them mid-word.
      //
      // This is the shop's highest-value form and it was the one place the
      // convention was skipped — `.trim()` and nothing else. It pairs with T125,
      // which added the matching caps and email validation on Order.customer:
      // before both, neither layer bounded the input.
      //
      // Not an XSS fix — the backend runs xss-clean globally. This bounds length
      // and normalises shape so the server is not asked to store a megabyte of
      // "address".
      const address = sanitizeText(addressLine(customer), 500);
      const orderBody = {
        items: items.map((i) => ({
          slug: i.slug,
          qty: i.qty,
          ...(i.variant && { variant: i.variant }),
        })),
        region: customer.region,
        customer: {
          name: sanitizeName(customer.name),
          // sanitizePhone normalises to the local 10-digit form and returns
          // undefined for anything that is not a Ghanaian number; the raw value
          // is the fallback so a legitimate edge case is refused by the server
          // with a message rather than silently blanked here.
          phone: sanitizePhone(customer.phone) || customer.phone.trim(),
          email: sanitizeEmail(user?.email) || "",
          address,
        },
      };
      if (inAccraCore) {
        const id =
          addressNeighborhoodId ||
          neighborhoodIdByName.get(String(selectedNeighborhood).trim().toLowerCase());
        if (id) orderBody.neighborhoodId = id;
      }
      if (shippingQuote?.quoteId) {
        orderBody.shippingQuoteId = shippingQuote.quoteId;
      } else {
        // Legacy / fallback path — backend recomputes the fee server-side
        // and never trusts the client.
        orderBody.city = customer.city;
        if (inAccraCore) orderBody.neighborhood = selectedNeighborhood;
        orderBody.method = selectedMethod || "in_house_delivery";
        if (!inAccraCore) orderBody.pickupLocationId = pickupLocationId;
      }
      const res = await api.post("/orders", orderBody);
      const { authorizationUrl } = res.data;
      if (authorizationUrl) {
        const saved = {
          street: customer.street.trim(),
          region: customer.region,
          city: customer.city,
          neighborhood: customer.neighborhood.trim(),
        };
        if (user) {
          const sRes = await api.post("/addresses", saved).catch(() => null);
          if (sRes?.data) {
            setSavedAddresses((prev) => {
              const without = prev.filter((a) => addressLine(a) !== addressLine(saved));
              return [sRes.data, ...without];
            });
          }
        } else {
          persistLocal(saved);
          setSavedAddresses(pickSavedAddresses());
        }
        clearCart();
        window.location.href = authorizationUrl;
      } else {
        setError("Unable to initialize payment. Please try again.");
      }
    } catch (err) {
      setError(errorMessage(err, "Checkout failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink px-4 pt-28 pb-24">
        <div className="mx-auto max-w-md flex flex-col items-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-900 px-6 py-16 text-center">
          <p className="text-3xl mb-3"><ShoppingCart size={30} className="inline text-gray-600 dark:text-slate-500" /></p>
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</p>
          <p className="text-gray-600 dark:text-slate-500 text-sm mb-6">Add a product to the cart before checking out.</p>
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 dark:bg-brand-500 px-5 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
          >
            Browse the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink px-4 pt-28 pb-24">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={10} /> Back to cart
        </Link>

        <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-10">
          One step — tell us where to deliver and pay securely with Paystack.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
          {/* LEFT: customer details + delivery zone */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact & Address</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Phone *</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+233 XX XXX XXXX"
                    className={inputCls}
                  />
                </div>
              </div>

              <label className="mb-2 mt-6 block text-xs font-medium text-gray-700 dark:text-slate-300">
                Delivery Address
              </label>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => {
                    const line = addressLine(addr);
                    const selected =
                      customer.street.trim() === (addr.street || "").trim() &&
                      customer.neighborhood.trim() === (addr.neighborhood || "").trim() &&
                      customer.city === (addr.city || "") &&
                      customer.region === (addr.region || "");
                    return (
                      <label
                        key={addr._id || line}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                          selected
                            ? "border-brand-300 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-ink dark:hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={selected}
                          onChange={() => selectSavedAddress(addr)}
                          className="mt-1 h-4 w-4 accent-brand-500 flex-shrink-0"
                        />
                        <span className="flex-1 text-left">
                          <span className="text-sm text-gray-700 dark:text-slate-300 break-words block">{line}</span>
                          {addr.label && <span className="text-xs font-medium text-gray-600 dark:text-slate-500 mt-0.5 block">{addr.label}</span>}
                        </span>
                        {addr._id && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await api.delete(`/addresses/${addr._id}`);
                                setSavedAddresses((prev) => prev.filter((a) => a._id !== addr._id));
                              } catch {
                                /* ignore — selection still works */
                              }
                            }}
                            aria-label="Delete this address"
                            className="mt-0.5 p-1.5 text-gray-600 hover:text-red-500 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </label>
                    );
                  })}
                  {savedAddresses.length >= MAX_SAVED && (
                    <p className="pt-1 text-xs text-gray-600 dark:text-slate-500">
                      Maximum of {MAX_SAVED} saved addresses — delete one to add another.
                    </p>
                  )}
                  {user && (
                    <Link
                      href="/dashboard/addresses"
                      className="inline-block pt-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Manage saved addresses
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={openModal}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-500 dark:hover:text-brand-400 transition"
                >
                  <Plus size={12} /> {addressLine(customer) ? "Change address" : "Add delivery address"}
                </button>
              </div>

              {/* Read-only address preview once the cascade is complete — saves
                  the customer having to mentally stitch region → city together. */}
              {customer.region && customer.city && (
                <div className="mt-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-xs text-gray-600 dark:text-slate-400">
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Delivering to: </span>
                  {[customer.street, selectedNeighborhood || customer.neighborhood, customer.city, customer.region]
                    .map((p) => (p || "").trim())
                    .filter(Boolean)
                    .join(", ")}
                  {inAccraCore ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      HOME DELIVERY
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      BUS / STC PICKUP
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {inAccraCore ? "Delivery Method" : "Pickup Location"}
              </h2>

              {!customer.region || !customer.city ? (
                <p className="text-sm text-gray-600 dark:text-slate-500">
                  Fill in your region and city above to see delivery options.
                </p>
              ) : !inAccraCore ? (
                /* ── Outside Greater Accra: bus-station pickup ───────────── */
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    We deliver to a bus station near you. Select where you&apos;ll collect your order.
                  </p>
                  {busStationsQuery.isLoading ? (
                    <p className="text-sm text-gray-500 dark:text-slate-500">Loading pickup locations…</p>
                  ) : busStations.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-slate-500">
                      No pickup locations are currently available for {customer.city}. Please contact support.
                    </p>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">
                        Pickup station *
                      </label>
                      <select
                        value={pickupLocationId}
                        onChange={(e) => setPickupLocationId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select a pickup station</option>
                        {busStations.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.landmark ? ` — ${s.landmark}` : ""}
                          </option>
                        ))}
                      </select>
                      {pickupLocationId && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-slate-500">
                          {busStations.find((s) => s.id === pickupLocationId)?.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : !selectedNeighborhood ? (
                // Pick the area right here. Telling the customer to "fill in
                // your neighbourhood above" was a dead end — the only
                // neighbourhood field lived inside the address modal, so a
                // saved address without one left them with an instruction and
                // nothing to act on.
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">
                    Which area in {customer.city}?
                  </label>
                  {neighborhoodOptions.length > 0 ? (
                    <>
                      <select
                        value={customer.neighborhood || ""}
                        onChange={(e) => {
                          const picked = neighborhoodOptions.find((n) => n.name === e.target.value);
                          setCustomer((c) => ({ ...c, neighborhood: e.target.value }));
                          setAddressNeighborhoodId(picked ? picked.id : "");
                        }}
                        className={inputCls}
                      >
                        <option value="">Select your area</option>
                        {neighborhoodOptions.map((n) => (
                          <option key={n.id} value={n.name}>
                            {n.name}{n.municipality ? ` — ${n.municipality}` : ""}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-gray-600 dark:text-slate-500">
                        We price delivery by area, so this sets your delivery fee.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-slate-500">
                      {neighborhoodOptionsQuery.isLoading
                        ? "Loading delivery areas…"
                        : `We don't have delivery areas listed for ${customer.city} yet. Please contact us to arrange delivery.`}
                    </p>
                  )}
                </div>
              ) : methods.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-slate-500">
                  No delivery methods available for {customer.city}.
                </p>
              ) : (
                <div className="space-y-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={m.available === false}
                      aria-disabled={m.available === false}
                      onClick={() => {
                        if (m.available === false) return;
                        setSelectedMethod(m.id);
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        m.available === false
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                          : selectedMethod === m.id
                          ? "border-brand-300 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                          : "border-gray-100 bg-white hover:border-gray-200 dark:border-slate-800 dark:bg-ink dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>
                        {(() => {
                          // One rule for every row: show the quoted figure once
                          // we have it, otherwise the figure this method came
                          // with — and never a stale number dressed as final.
                          // The old logic fell back to the indicative fee while
                          // a quote was in flight, so picking a courier showed a
                          // price that changed seconds later.
                          const isSelected = selectedMethod === m.id;
                          const quoted = isSelected && shippingQuote;
                          const fee = quoted ? quoteFee : m.indicativeFee;
                          const isFree = quoted
                            ? shippingQuote.freeDeliveryApplied || quoteFee === 0
                            : m.freeDeliveryApplied === true;
                          const unknown = fee == null && !isFree;

                          return (
                            <span
                              className={`font-semibold ${
                                isFree ? "text-emerald-600 dark:text-emerald-400" : "text-brand-500"
                              }`}
                            >
                              {isFree ? "Free" : unknown ? "—" : formatGhs(fee || 0)}
                            </span>
                          );
                        })()}
                      </div>
                      {/* Owner requirement (2026-08-30): say plainly why a shown
                          option cannot be picked. The server sends the reason —
                          e.g. "Express delivery closes at 5:00 PM. Please choose
                          Next Day or Standard for this order." — so the wording
                          stays in step with the cutoff hour actually configured
                          rather than hardcoding "5 PM" in the UI. */}
                      {m.available === false && (
                        <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-500">
                          {m.unavailableReason ||
                            "Not available right now. Please choose another delivery option."}
                        </p>
                      )}
                      {m.available !== false && m.estimatedDays != null && (
                        <p className="text-sm text-gray-600 dark:text-slate-500 mt-1">
                          {m.speed === "same_day"
                            ? "Delivered today"
                            : m.speed === "next_day"
                            ? "Delivered within 24 hours"
                            : m.speed === "express"
                            ? "Same day — within a few hours"
                            : // The zone states its own promise ("1-3"), so read it
                              // rather than pluralising a number: `"1" === 1` is
                              // false, which printed "1 days".
                              `${m.estimatedDays} ${String(m.estimatedDays) === "1" ? "day" : "days"} estimated delivery`}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: order summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wider mb-4">Order Summary</h3>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800 border-b border-gray-100 dark:border-slate-800 mb-4">
                {items.map((item) => (
                  <li key={item.lineId} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="text-gray-700 dark:text-slate-300">
                      {item.name}{" "}
                      {item.variant?.attributes &&
                        Object.values(item.variant.attributes).length > 0 && (
                          <span className="text-gray-600 dark:text-slate-500">
                            ({Object.values(item.variant.attributes).join(" ")})
                          </span>
                        )}{" "}
                      <span className="text-gray-600 dark:text-slate-500">× {item.qty}</span>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatGhs(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{formatGhs(subtotal)}</span>
                </div>
                {selectedMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">
                      {!inAccraCore
                        ? "Pickup fee"
                        : selectedMethodInfo?.name || "Delivery"}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {quoteError ? "—" : deliveryFee > 0 ? formatGhs(deliveryFee) : "Free"}
                    </span>
                  </div>
                )}
                {/* A refused quote is shown, never hidden behind a blank fee —
                    the customer needs to know why they cannot check out. */}
                {quoteError && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                    {quoteError}
                  </p>
                )}
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-3 font-semibold text-base">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-brand-500">{formatGhs(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-5 w-full rounded-full bg-gray-900 dark:bg-brand-500 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
              >
                {loading ? "Processing..." : `Pay ${formatGhs(total)} Securely`}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-600 dark:text-slate-500">
                <Lock size={10} /> Secured by Paystack — card &amp; mobile money
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save address modal — T80 cascade */}
      <AddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={modalForm}
        setForm={setModalForm}
        onSave={saveModalAddress}
        saving={modalSaving}
        error={modalError}
      />
    </div>
  );
}

function AddressModal({ open, onClose, form, setForm, onSave, saving, error }) {
  const regionsQuery = useLocationRegions();
  const regions = regionsQuery.data ?? [];
  const citiesQuery = useLocationCities(form.region);
  const neighborhoodsQuery = useLocationNeighborhoods(form.region, form.city);
  const cities = citiesQuery.data ?? [];
  const neighborhoods = neighborhoodsQuery.data?.neighborhoods ?? [];
  const selectedCityEntry = cities.find((c) => c.city === form.city) || null;
  const isInAccraCore = Boolean(selectedCityEntry?.inAccraCore);

  // An address that cannot be priced is worse than no address: it saves
  // cleanly, then strands the customer on a checkout with no delivery options
  // and nothing explaining why. Region and city are always needed; inside the
  // Greater-Accra core the neighbourhood is what selects the zone, so it is
  // needed too. Outside the core, pricing is per-region and the neighbourhood
  // is genuinely optional.
  const canSave = Boolean(
    form.region.trim() && form.city.trim() && (!isInAccraCore || form.neighborhood.trim()),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">Add a New Address</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">
              Label <span className="text-gray-600 dark:text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Home, Office"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Street Address</label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              placeholder="House number and street"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Region *</label>
            {/* A dropdown, not free text. The region lookup is an exact match,
                so a typo or different casing returned zero cities and quietly
                collapsed the whole cascade — no city, no neighbourhood, and
                checkout falling through to bus-station pickup. */}
            {regions.length > 0 ? (
              <select
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value, city: "", neighborhood: "" }))}
                className={inputCls}
              >
                <option value="">Select region</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value, city: "", neighborhood: "" }))}
                placeholder="e.g. Greater Accra"
                className={inputCls}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">City *</label>
              {cities.length > 0 ? (
                <select
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, neighborhood: "" }))}
                  className={inputCls}
                  disabled={!form.region}
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.city} value={c.city}>{c.city}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, neighborhood: "" }))}
                  placeholder="e.g. Accra, Kumasi"
                  className={inputCls}
                  disabled={!form.region}
                />
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">
                Neighborhood{!isInAccraCore && <span className="text-gray-600 dark:text-slate-500"> (optional)</span>} *
              </label>
              {neighborhoods.length > 0 ? (
                <select
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                  className={inputCls}
                  disabled={!form.city}
                >
                  <option value="">Select neighborhood</option>
                  {neighborhoods.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                  placeholder={isInAccraCore ? "Neighborhood" : "Optional"}
                  className={inputCls}
                  disabled={!form.city}
                />
              )}
            </div>
          </div>

          {form.city && (
            <p className={`text-xs ${isInAccraCore ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {isInAccraCore
                ? "✓ Greater Accra — home delivery available"
                : "Outside Greater Accra — bus-station pickup only"}
            </p>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {!canSave && (form.region || form.city) && (
            <p className="text-xs text-gray-600 dark:text-slate-500">
              {!form.region
                ? "Select a region to continue."
                : !form.city
                  ? "Select a city to continue."
                  : "Select your neighbourhood — we price delivery by area."}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-gray-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-paper dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !canSave}
              className="flex-1 rounded-full bg-gray-900 dark:bg-brand-500 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
