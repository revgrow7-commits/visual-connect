import { holdprintList } from "./api";
import type { PaginationParams, PaginatedResult, HoldprintCustomer } from "./types";

export const customersService = {
  list(params: PaginationParams): Promise<PaginatedResult<HoldprintCustomer>> {
    return holdprintList<HoldprintCustomer>("/customers", params);
  },
};
