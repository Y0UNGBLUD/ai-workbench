export interface User {
  id: number
  name: string
  username: string
  email: string
  teamId: number
  teamName: number
  roles: Role[]
}

export interface Role {
  id: number
  name: string
}

export interface Team {
  id: number
  name: string
}
