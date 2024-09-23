import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Tex "../example/types";
import Timer "mo:base/Timer";
import Prng "mo:prng";
import DeVeFi "../src/";
import Nat "mo:base/Nat";
import Account "mo:account";
import ICRC55 "../src/ICRC55";
import Node "../src/node";
import Nat8 "mo:base/Nat8";
import Array "mo:base/Array";
import Debug "mo:base/Debug";

actor class({ledgerId: Principal}) = self {

    // Throttle vector
    // It will send X amount of tokens every Y seconds

    // ILDE let NTN_LEDGER = Principal.fromText("f54if-eqaaa-aaaaq-aacea-cai");
    let NODE_FEE = 1_0000_0000;
    let ICRC_LEDGER = ledgerId; 
    
    stable let dvf_mem = DeVeFi.Mem();
    let rng = Prng.SFC64a();
    rng.init(123456);

    let supportedLedgers : [Principal] = [
        Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"), // ILDE this is the ICP ledger
        //ILDE NTN_LEDGER,
        ICRC_LEDGER, //ILDE: this is the ledger created by ts test script
        // Principal.fromText("mxzaz-hqaaa-aaaar-qaada-cai"),
        // Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai"),
    ];

    let dvf = DeVeFi.DeVeFi<system>({ mem = dvf_mem });
    dvf.add_ledger<system>(supportedLedgers[0], #icp);
    dvf.add_ledger<system>(supportedLedgers[1], #icrc);
    // dvf.add_ledger<system>(supportedLedgers[2], #icrc);
    // dvf.add_ledger<system>(supportedLedgers[3], #icrc);

    stable let node_mem = Node.Mem<Tex.Mem>();
    let nodes = Node.Node<system, Tex.CreateRequest, Tex.Mem, Tex.Shared, Tex.ModifyRequest>({
        mem = node_mem;
        dvf;
        nodeCreateFee = func(_node) {
            {
                amount = NODE_FEE;
                ledger = ICRC_LEDGER; //ILDE: removed NTN_LEDGER;
            };
        };
        supportedLedgers = Array.map<Principal, ICRC55.SupportedLedger>(supportedLedgers, func (x) = #ic(x));
        settings = {
            Node.DEFAULT_SETTINGS with
            MAX_SOURCES = 1 : Nat8;
            MAX_DESTINATIONS = 1 : Nat8;
            PYLON_NAME = "Transcendence";
            PYLON_GOVERNED_BY = "Neutrinite DAO"
        };
        toShared = Tex.toShared;
        sourceMap = Tex.sourceMap;
        destinationMap = Tex.destinationMap;
        createRequest2Mem = Tex.createRequest2Mem;
        modifyRequestMut = Tex.modifyRequestMut;
        getDefaults = Tex.getDefaults;
        meta = Tex.meta;
    });

    // Main DeVeFi logic
    //
    // Every 2 seconds it goes over all nodes
    // And decides whether to send tokens to destinations or not

    // Notes:
    // The balances are automatically synced with ledgers and can be used synchronously
    // Sending tokens also works synchronously - adds them to queue and sends them in the background
    // No need to handle errors when sending, the transactions will be retried until they are successful
    ignore Timer.recurringTimer<system>(
        #seconds(2),
        func() : async () {Debug.print("l10");
            let now = Nat64.fromNat(Int.abs(Time.now()));Debug.print("l101");
            label vloop for ((vid, vec) in nodes.entries()) {
Debug.print("l102");
                if (not nodes.hasDestination(vec, 0)) continue vloop;
Debug.print("l103");
                let ?source = nodes.getSource(vec, 0) else continue vloop;
     // Debug.print("l104, source:"#debug_show(source));          
                let bal = source.balance();
Debug.print("l105");
                let fee = source.fee();
                
                Debug.print("source.endpoint:"#debug_show(source.endpoint));
                Debug.print("bal:"#debug_show(bal));
                Debug.print("fee:"#debug_show(fee));
                if (bal <= fee * 100) continue vloop;
Debug.print("l106");
                switch (vec.custom) {
                    case (#throttle(th)) {
                        Debug.print("l1");
                        if (now > th.internals.wait_until_ts) {Debug.print("l12");
                            switch (th.variables.interval_sec) {
                                case (#fixed(fixed)) {Debug.print("l14");
                                    th.internals.wait_until_ts := now + fixed * 1_000_000_000;
                                };
                                case (#rnd({ min; max })) {Debug.print("l15");
                                    let dur : Nat64 = if (min >= max) 0 else rng.next() % (max - min);
                                    th.internals.wait_until_ts := now + (min + dur) * 1_000_000_000;
                                };
                            };

                            let max_amount : Nat64 = switch (th.variables.max_amount) {
                                case (#fixed(fixed)) fixed;
                                case (#rnd({ min; max })) if (min >= max) 0 else min + rng.next() % (max - min);
                            };
                            Debug.print("l141");
                            var amount = Nat.min(bal, Nat64.toNat(max_amount));
                            Debug.print("l142");
                            if (bal - amount : Nat <= fee * 100) amount := bal; // Don't leave dust
                            Debug.print("l143");
                            source.send(#destination({ port = 0 }), amount);
                            Debug.print("l144:"#debug_show(amount));   
                        };
                    };
                };

            };
        },
    );

    public query func icrc55_get_nodefactory_meta() : async ICRC55.NodeFactoryMetaResp {
        nodes.icrc55_get_nodefactory_meta();
    };

    public query ({ caller }) func icrc55_create_node_get_fee(req : ICRC55.NodeRequest, creq : Tex.CreateRequest) : async ICRC55.NodeCreateFeeResp {
        nodes.icrc55_create_node_get_fee(caller, req, creq);
    };

    public shared ({ caller }) func icrc55_create_node(req : ICRC55.NodeRequest, creq : Tex.CreateRequest) : async Node.CreateNodeResp<Tex.Shared> {
        nodes.icrc55_create_node(caller, req, creq);
    };

    public query func icrc55_get_node(req : ICRC55.GetNode) : async ?Node.NodeShared<Tex.Shared> {
        nodes.icrc55_get_node(req);
    };

    public query ({ caller }) func icrc55_get_controller_nodes(req: ICRC55.GetControllerNodesRequest) : async [Node.NodeShared<Tex.Shared>] {
        nodes.icrc55_get_controller_nodes(caller, req);
    };

    public shared ({caller}) func icrc55_delete_node(vid : ICRC55.LocalNodeId) : async ICRC55.DeleteNodeResp {
        nodes.icrc55_delete_node(caller, vid);
    };

    public shared ({caller}) func icrc55_modify_node(vid : ICRC55.LocalNodeId, req : ?ICRC55.NodeModifyRequest, creq : ?Tex.ModifyRequest) : async Node.ModifyNodeResp<Tex.Shared> {
        nodes.icrc55_modify_node(caller, vid, req, creq);
    };

    public query func icrc55_get_defaults(id : Text) : async Tex.CreateRequest {
        nodes.icrc55_get_defaults(id);
    };

    // We need to start the vector manually once when canister is installed, because we can't init dvf from the body
    // https://github.com/dfinity/motoko/issues/4384
    // Sending tokens before starting the canister for the first time wont get processed
    public shared ({ caller }) func start() {
        Debug.print("Start1");
        assert (Principal.isController(caller));Debug.print("Start2");
        dvf.start<system>(Principal.fromActor(self));Debug.print("Start3");
        nodes.start<system>(Principal.fromActor(self));Debug.print("Start4");
    };





    // ---------- Debug functions -----------

    public query func get_ledger_errors() : async [[Text]] {
        dvf.getErrors();
    };

    public query func get_ledgers_info() : async [DeVeFi.LedgerInfo] {
        dvf.getLedgersInfo();
    };

    // Dashboard explorer doesn't show icrc accounts in text format, this does
    // Hard to send tokens to Candid ICRC Accounts
    public query func get_node_addr(vid : Node.NodeId) : async ?Text {
        let ?(_,vec) = nodes.getNode(#id(vid)) else return null;

        let subaccount = ?Node.port2subaccount({
            vid;
            flow = #input;
            id = 0;
        });

        ?Account.toText({ owner = Principal.fromActor(self); subaccount });
    };
};
