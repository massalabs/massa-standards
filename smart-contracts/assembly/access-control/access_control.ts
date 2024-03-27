import { fromBytes, toBytes } from "@massalabs/as-types";
import { Address, Storage } from "@massalabs/massa-as-sdk";

/**
 * Manages roles and permissions within a blockchain context using a bitmask approach.
 * Each bit in a bitmask represents a distinct permission. This class exploits
 * blockchain's native, map-like storage for efficient role and permission management.
 * 
 * Implementation details:
 * - Permissions are encoded as bits in a bitmask for compact storage and easy manipulation.
 * - User access rights are stored and managed in a similar bitmask format.
 * - Utilizes blockchain's native storage, with ModuleId as a prefix to differentiate keys
 *   belonging to different modules.
 */
export class AccessControl<T> {
  // @ts-ignore non-number type
  private permissionIndex: u8 = 0;
  private permissionsName: string[] = [];
  private moduleId: u8;
  private errPermissionDoesNotExist: string = 'Permission does not exist';

  constructor(moduleId: u8) {
    this.moduleId = moduleId;
  }

  private _getStorageKey(userAddress: Address): StaticArray<u8> {
    const key = new StaticArray<u8>(1);
    key[0] = this.moduleId;
    return key.concat(userAddress.serialize());
  }

  private _getUserAccess(userAddress: Address): T {
    const key = this._getStorageKey(userAddress);
    return Storage.has(key) ? <T>fromBytes<T>(Storage.get(key)) : <T>0;
  }

  private _setUserAccess(userAddress: Address, access: T): void {
    const key = this._getStorageKey(userAddress);
    Storage.set(key, toBytes(access));
  }

  private _permissionIndexToBitmask(permissionIndex: u8): T {
    return <T>(1 << permissionIndex);
  }

  public newPermission(Permission: string): T {
    assert(this.permissionIndex < sizeof<T>() * 8, `Maximum number of permissions reached`);
    this.permissionsName.push(Permission);
    this.permissionIndex += 1;
    return this._permissionIndexToBitmask(this.permissionIndex -1);
  }

  public grantPermissionToUser(permission: T, userAddress: Address): void {
    assert(permission < this._permissionIndexToBitmask(this.permissionIndex), this.errPermissionDoesNotExist);

    const ua = this._getUserAccess(userAddress);
    // @ts-ignore arithmetic operations on generic types
    assert((ua & permission) != permission, `User already has '${this.permissionsName[permission>>1]}' Permission`);
    // @ts-ignore arithmetic operations on generic types
    this._setUserAccess(userAddress, ua | permission);
  }

  public removePermissionFromUser(permission: T, userAddress: Address): void {
    assert(permission < this._permissionIndexToBitmask(this.permissionIndex), this.errPermissionDoesNotExist);
    
    const ua = this._getUserAccess(userAddress);
    // @ts-ignore arithmetic operations on generic types
    assert((ua & permission) == permission, `User does not have '${this.permissionsName[permission>>1]}' Permission`);
    // @ts-ignore arithmetic operations on generic types
    this._setUserAccess(userAddress, ua & ~permission);
  }

  public hasPermission(permission: T, userAddress: Address): boolean {
    assert(permission < this._permissionIndexToBitmask(this.permissionIndex), this.errPermissionDoesNotExist);

    const ua = this._getUserAccess(userAddress);
    // @ts-ignore arithmetic operations on generic types
    return (ua & permission) == permission;
  }

  public mustHavePermission(permission: T, userAddress: Address): void {
    assert(
      this.hasPermission(permission, userAddress),
      `User does not have ${this.permissionsName[permission>>1]} Permission`
    );
  }
}