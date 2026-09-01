// Central query-key registry. Always build keys through `qk` so invalidation
// targets stay consistent across hooks and components. Keys are hierarchical:
// invalidating a prefix (e.g. ["orders"]) invalidates everything under it.
export const qk = {
  orders: {
    all: ["orders"],
    list: (filters = {}) => ["orders", "list", filters],
    recent: ["orders", "recent"],
    mine: ["orders", "mine"],
    detail: (id) => ["orders", "detail", id],
    tracking: (trackingNumber) => ["orders", "tracking", trackingNumber],
    // T45 — the pre-order release queue. Under "orders" so releasing one, which
    // invalidates the prefix, refreshes the lists that show the same order.
    preorders: ["orders", "preorders"],
  },
  // T45 — incoming stock batches (a container from a supplier).
  shipments: {
    all: ["shipments"],
    list: ["shipments", "list"],
    detail: (id) => ["shipments", "detail", id],
  },
  // POS sales — scoped server-side: staff see only their own, admin sees all.
  posSales: {
    all: ["posSales"],
    list: (params = {}) => ["posSales", "list", params],
    summary: ["posSales", "summary"],
  },
  inventory: {
    all: ["inventory"],
    list: (params = {}) => ["inventory", "list", params],
    search: (term, params = {}) => ["inventory", "search", term, params],
  },
  // Public repair-parts catalogue (the /track parts search — no auth).
  parts: {
    all: ["parts"],
    search: (params = {}) => ["parts", "search", params],
  },
  products: {
    all: ["products"],
    admin: ["products", "admin"],
    list: (params = {}) => ["products", "list", params],
    detail: (slug) => ["products", "detail", slug],
    // T109 — admin get-by-id. Distinct from `detail`, which is keyed by SLUG
    // and served by the public route; this one is keyed by _id and can return
    // an archived product.
    adminDetail: (id) => ["products", "admin", "detail", id],
  },
  deliveryZones: {
    all: ["delivery-zones"],
    list: ["delivery-zones", "list"],
  },
  pos: {
    overview: (range = {}) => ["pos", "overview", range],
    myOverview: ["pos", "my-overview"],
    partOrders: (status = "all") => ["pos", "part-orders", status],
  },
  hosting: {
    all: ["hosting"],
    mine: ["hosting", "mine"],
    adminOverview: ["hosting", "admin-overview"],
    adminSummary: ["hosting", "admin-summary"],
    plans: ["hosting", "plans"],
    adminList: (params = {}) => ["hosting", "admin-list", params],
    awaitingProvisioning: ["hosting", "awaiting-provisioning"],
    detail: (id) => ["hosting", "detail", id],
  },
  settings: {
    all: ["settings"],
  },
  domains: {
    all: ["domains"],
    mine: ["domains", "mine"],
    registered: ["domains", "registered"],
    list: (params = {}) => ["domains", "list", params],
  },
  reviews: {
    all: ["reviews"],
    list: ["reviews", "all"],
  },
  productReviews: {
    all: ["product-reviews"],
    list: (productId) => ["product-reviews", "list", productId],
    mine: (productId) => ["product-reviews", "mine", productId],
    eligibility: (productId) => ["product-reviews", "eligibility", productId],
  },
  emails: {
    all: ["emails"],
    list: (params = {}) => ["emails", "list", params],
  },
  repairs: {
    mine: ["repairs", "mine"],
  },
  jobs: {
    all: ["jobs"],
    list: (params = {}) => ["jobs", "list", params],
    warranty: ["jobs", "warranty"],
  },
  expenses: {
    all: ["expenses"],
    list: (params = {}) => ["expenses", "list", params],
  },
  suppliers: {
    all: ["suppliers"],
    list: (params = {}) => ["suppliers", "list", params],
    detail: (id) => ["suppliers", "detail", id],
  },
  reports: {
    analytics: (range = {}) => ["reports", "analytics", range],
  },
  activityLogs: {
    all: ["activity-logs"],
    list: (params = {}) => ["activity-logs", "list", params],
  },
  users: {
    all: ["auth", "users"],
  },
  notifications: {
    all: ["notifications"],
    list: (params = {}) => ["notifications", "list", params],
    unreadCount: ["notifications", "unread-count"],
  },
  shipping: {
    all: ["shipping"],
    settings: ["shipping", "settings"],
    zones: ["shipping", "zones"],
    tiers: ["shipping", "tiers"],
    courierRate: ["shipping", "courier-rate"],
    distances: (region, city) => ["shipping", "distances", region || "", city || ""],
    neighborhoods: (params) => ["shipping", "admin-neighborhoods", params || {}],
    neighborhoodCoverage: ["shipping", "neighborhood-coverage"],
  },
  // T80 E2 — public Location + Pickup reads for the checkout cascade.
  locations: {
    all: ["locations"],
    grouped: ["locations", "grouped"],
    regions: ["locations", "regions"],
    cities: (region) => ["locations", "cities", region],
    neighborhoods: (region, city) => ["locations", "neighborhoods", region, city],
  },
  pickups: {
    all: ["pickups"],
    byCity: (region, city) => ["pickups", "byCity", region, city],
  },
  // The customer's own saved delivery addresses (models/Address.js). One key —
  // the list is small, always the caller's own, and every mutation returns or
  // invalidates the whole thing.
  addresses: {
    all: ["addresses"],
    list: ["addresses", "list"],
  },
};
