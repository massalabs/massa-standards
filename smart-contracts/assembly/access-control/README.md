# AccessControl

The `AccessControl` class provides a flexible and efficient system for managing roles and permissions within a blockchain context. By utilizing a bitmask approach, it encodes permissions in a compact and easily manipulable format. This approach, combined with the use of blockchain's native, map-like storage, allows for efficient and effective role and permission management.

## Features

- **Bitmask-based Permissions**: Each bit in a bitmask represents a unique permission, allowing for compact storage and straightforward manipulation of permissions.
- **Efficient Storage Utilization**: Leverages blockchain's native storage capabilities, using ModuleId as a prefix to differentiate keys associated with different modules.
- **Dynamic Permission Management**: Supports creating new permissions, granting/removing permissions to/from users, and checking user permissions dynamically at runtime.

## Usage Example

```typescript
import { Address } from '@massalabs/massa-as-sdk';
import { AccessControl } from '@massalabs/sc-standards';

const controller = new AccessControl<u8>(1);

const ADMIN = controller.newPermission('admin');
const USER = controller.newPermission('user');


function constructor(admin: Address, user: Address): void {
    controller.grantPermission(ADMIN, admin);
    controller.grantPermission(USER, user);
}

function adminOnly(caller: Address): void {
    controller.mustHavePermission(ADMIN, adminAddress);
     // Admin-only operations go here
}

function userOrAdmin(caller: Address): void {
    controller.mustHavePermission(ADMIN||USER, adminAddress);
    // Operations for users or admins go here
}
```

For more examples and usage scenarios, refer to the unit tests.