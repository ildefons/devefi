import ICRC55 "../src/ICRC55";
import Node "../src/node";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Debug "mo:base/Debug";
import U "../src/utils";

module {

    public func meta(all_ledgers : [ICRC55.SupportedLedger]) : ICRC55.NodeMeta {
        {
            id = "escrow"; // This has to be same as the variant in vec.custom
            name = "Escrow";
            description = "Escrow X tokens";
            supported_ledgers = all_ledgers;
            pricing = "1 NTN";
            version = #alpha;
        };
    };

    // Internal vector state
    public type Mem = {
        init : {
            ledger : Principal;
        };
        variables : {
        };
        internals : {};
    };

    // Create request
    public type CreateRequest = {
        init : {
            ledger : Principal;
        };
        variables : {
        };
    };

    // Create state from request
    public func createRequest2Mem(t : CreateRequest) : Mem {
        {
            init = t.init;
            variables = {
            };
            internals = {};
        };
    };

    public func defaults(all_ledgers : [ICRC55.SupportedLedger]) : CreateRequest {
        let #ic(ledger) = all_ledgers[0] else Debug.trap("No ledgers found");
        {
            init = {
                ledger;
            };
            variables = {
            };
        };
    };

    // Modify request
    public type ModifyRequest = {
        
    };

    // How does the modify request change memory
    public func modifyRequestMut(mem : Mem, t : ModifyRequest) : Result.Result<(), Text> {
        #ok();
    };

    // Public shared state
    public type Shared = {
        init : {
            ledger : Principal;
        };
        variables : {
        };
        internals : {};
    };

    // Convert memory to shared
    public func toShared(t : Mem) : Shared {
        {
            init = t.init;
            variables = {
            };
            internals = {};
        };
    };

    // Mapping of source node ports
    public func request2Sources(t : Mem, id : Node.NodeId, thiscan : Principal) : Result.Result<[ICRC55.Endpoint], Text> {
        #ok([
            #ic {
                ledger = t.init.ledger;
                account = {
                    owner = thiscan;
                    subaccount = ?Node.port2subaccount({
                        vid = id;
                        flow = #input;
                        id = 0;
                    });
                };
                name = "";
            }
        ]);
    };

    // Mapping of destination node ports
    //
    // Allows you to change destinations and dynamically create new ones based on node state upon creation or modification
    // Fills in the account field when destination accounts are given
    // or leaves them null when not given
    public func request2Destinations(t : Mem, req : [ICRC55.DestinationEndpoint]) : Result.Result<[ICRC55.DestinationEndpoint], Text> {
   
        let #ok(success_account) = U.expectAccount(t.init.ledger, req, 0) else return #err("Invalid destination 0");
        let #ok(fail_account) = U.expectAccount(t.init.ledger, req, 1) else return #err("Invalid destination 1");

        #ok([
            #ic {
                ledger = t.init.ledger;
                account = success_account;
                name = "Success";
            },
            #ic {
                ledger = t.init.ledger;
                account = fail_account;
                name = "Fail";
            }
        ]);
    };



};
