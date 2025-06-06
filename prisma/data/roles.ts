export const dataRoles = [
  {
    sequence: 1,
    symbol: "ADMIN",
    name: "Administrator",
    description: "Who can do anything",
    permissionsAccess: "ANY",
  },
  {
    sequence: 2,
    symbol: "MANAGER",
    name: "Manager",
    description: "Who can do some management",
    permissionsAccess: "ANY",
  },
  {
    sequence: 3,
    symbol: "NORMAL",
    name: "Normal",
    description: "Who can do normal stuff",
    permissionsAccess: "OWN",
  },
  {
    sequence: 4,
    symbol: "CUSTOMER",
    name: "Customer",
    description: "Customer/Client",
    permissionsAccess: "OWN",
  },
]
