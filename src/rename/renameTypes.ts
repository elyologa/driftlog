export interface RenameEntry {
  oldName: string;
  newName: string;
  renamedAt: string;
}

export interface RenameStore {
  renames: RenameEntry[];
}

export interface RenameResult {
  success: boolean;
  oldName: string;
  newName: string;
  message: string;
}
