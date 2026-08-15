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
  },
  inventory: {
    all: ["inventory"],
    list: (params = {}) => ["inventory", "list", params],
    search: (term) => ["inventory", "search", term],
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
    detail: (id) => ["hosting", "detail", id],
  },
  domains: {
    all: ["domains"],
    mine: ["domains", "mine"],
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
};
