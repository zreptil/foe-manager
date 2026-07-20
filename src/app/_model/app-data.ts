import {BaseData} from '@/_model/base-data';
import {PersonData} from '@/_model/person-data';
import {EnumPermission} from '@/_model/user-data';

export enum UserType {
  Admin = 1 << 0,
  User = 1 << 1
}

export type TypeUser = { label: string, value: UserType, name: string };
export type TypeUserList = { [key: string]: TypeUser };

export class AppData extends BaseData {
// msg: { [key: string]: any[] };
  static UserTypes: TypeUserList =
    {
      admin: {label: $localize`Admin`, value: UserType.Admin, name: 'Admin'},
      owner: {label: $localize`User`, value: UserType.User, name: 'User'}
    }

  usertype: UserType;
  permissions: number[];
  person: PersonData;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    return {
      a: this.person.asJson,
    };
  }

  override _fillFromJson(json: any, def?: any): void {
    this.person = new PersonData(json?.a ?? def?.person);
  }

  may(perm: EnumPermission): boolean {
    return this.usertype === UserType.Admin || this.permissions?.indexOf(perm) >= 0;
  }
}
