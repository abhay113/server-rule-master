
export interface User {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}

export interface OnboardUser extends User {
    groupName: string;
    roleName: string;
}