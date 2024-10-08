import { Mint } from './../../devefi_icrc_ledger(old)/test/icrc_ledger/ledger.idl.d';
import { Principal } from '@dfinity/principal';
import { resolve } from 'node:path';
import { Actor, PocketIc, createIdentity } from '@hadronous/pic';
import { IDL } from '@dfinity/candid';
import { _SERVICE as TestService, idlFactory as TestIdlFactory, init as TestInit} from './build/basic.idl.js';
import { _SERVICE as NodeService, idlFactory as NodeIdlFactory, init as NodeInit, 
         NodeId,        
         NodeRequest,
         CreateRequest,
         CreateRequest__7, // throttle
         CreateNodeResp,
         DestinationEndpoint,
         DestICEndpoint,
         Account,
         Endpoint,
         ICEndpoint,
         NodeModifyRequest,
         ModifyRequest,
        } from './build/basic_node.idl.js';

//import {ICRCLedgerService, ICRCLedger} from "./icrc_ledger/ledgerCanister";
import {ICRCLedgerService, ICRCLedger} from "./icrc_ledger/ledgerCanister";
//@ts-ignore
import {toState} from "@infu/icblast";
// Jest can't handle multi threaded BigInts o.O That's why we use toState

const WASM_PATH = resolve(__dirname, "./build/basic.wasm");
const WASM_NODE_PATH = resolve(__dirname, "./build/basic_node.wasm");

export async function TestCan(pic:PocketIc, ledgerCanisterId:Principal) {
    
    const fixture = await pic.setupCanister<TestService>({
        idlFactory: TestIdlFactory,
        wasm: WASM_PATH,
        arg: IDL.encode(NodeInit({ IDL }), [{ledgerId: ledgerCanisterId}]),
    });

    return fixture;
};

export async function NodeCan(pic:PocketIc, ledgerCanisterId:Principal) {
    
  const fixture = await pic.setupCanister<NodeService>({
      idlFactory: NodeIdlFactory,
      wasm: WASM_NODE_PATH,
      arg: IDL.encode(NodeInit({ IDL }), [{ledgerId: ledgerCanisterId}]),
  });

  return fixture;
};

describe('Basic', () => {
    let pic: PocketIc;
    let user: Actor<TestService>;
    let ledger: Actor<ICRCLedgerService>;
    let node: Actor<NodeService>;
    let userCanisterId: Principal;
    let ledgerCanisterId: Principal;
    let nodeCanisterId: Principal;

    const jo = createIdentity('superSecretAlicePassword');
    const bob = createIdentity('superSecretBobPassword');
    const ali = createIdentity('superSecretAliPassword');
    const ali2 = createIdentity('superSecretAli2Password');
    
    // var source_principal:Principal = bob.getPrincipal();
    // var source_principal_sub:[] | [Uint8Array | number[]] = [];
  
    beforeAll(async () => {

      pic = await PocketIc.create(process.env.PIC_URL);

      // Ledger
      const ledgerfixture = await ICRCLedger(pic, jo.getPrincipal(), pic.getSnsSubnet()?.id);
      ledger = ledgerfixture.actor;
      ledgerCanisterId = ledgerfixture.canisterId;
      
      // Ledger User

      // const fixture = await TestCan(pic, ledgerCanisterId);
      // user = fixture.actor;
      // userCanisterId = fixture.canisterId;

      // Node canister
      const nodefixture = await NodeCan(pic, ledgerCanisterId);
      node = nodefixture.actor;
      nodeCanisterId = nodefixture.canisterId;

    });
  
    afterAll(async () => {
      await pic.tearDown();  //ILDE: this means "it removes the replica"
    });   

    // it('tests', async () => {
    //   let r = await user.test();
    //   expect(r).toBe(5n);
    // });

    it(`Check (minter) balance`  , async () => {
      const result = await ledger.icrc1_balance_of({owner: jo.getPrincipal(), subaccount: []});
      // console.log("jo balance:",result)
      const result2 = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
      // console.log("bob balance:",result2)
      expect(toState(result)).toBe("100000000000")
      expect(toState(result2)).toBe("0")
    });

    // it(`Send 1 to Bob`, async () => {
    //   ledger.setIdentity(jo);
    //   const result = await ledger.icrc1_transfer({
    //     to: {owner: bob.getPrincipal(), subaccount:[]},
    //     from_subaccount: [],
    //     amount: 1_0000_0000n,
    //     fee: [],
    //     memo: [],
    //     created_at_time: [],
    //   });
    //   expect(toState(result)).toStrictEqual({Ok:"1"});
    // });

    // it(`Check Bob balance`  , async () => {
    //   const result = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
    //   expect(toState(result)).toBe("100000000")
    // });

    // it(`last_indexed_tx should start at 0`, async () => {
    //   const result = await user.get_info();
    //   expect(toState(result.last_indexed_tx)).toBe("0");
    // });

    // it(`Check ledger transaction log`  , async () => {
    //   const result = await ledger.get_transactions({start: 0n, length: 100n});
    //   expect(result.transactions.length).toBe(2);
    //   expect(toState(result.log_length)).toBe("2");
    // }); 

    // it(`start and last_indexed_tx should be at 1`, async () => {
   
    //   await passTime(1);
    //   const result = await user.start();
    //   await passTime(3);
    //   const result2 = await user.get_info();
    //   expect(toState(result2.last_indexed_tx)).toBe("2");
    // });

    // it(`feed ledger user and check if it made the transactions`, async () => {
   
    //   const result = await ledger.icrc1_transfer({
    //     to: {owner: userCanisterId, subaccount:[]},
    //     from_subaccount: [],   // ILDE: what does it mean mean rom_subaccount = []??? 
    //     amount: 1000000_0000_0000n,
    //     fee: [],
    //     memo: [],
    //     created_at_time: [],
    //   });
    //   await passTime(120);
    //   const result2 = await user.get_info();
    //   expect(toState(result2.last_indexed_tx)).toBe("6003");     
    // }, 600*1000);

    // it('Compare user<->ledger balances', async () => {
    //   let accounts = await user.accounts();
    //   let idx =0;
    //   for (let [subaccount, balance] of accounts) {
    //     idx++;
    //     if (idx % 50 != 0) continue; // check only every 50th account (to improve speed, snapshot should be enough when trying to cover all)
    //     let ledger_balance = await ledger.icrc1_balance_of({owner: userCanisterId, subaccount:[subaccount]});
    //     expect(toState(balance)).toBe(toState(ledger_balance));
    //   } 
    // }, 190*1000);


    // it('Compare user balances to snapshot', async () => {
    //   let accounts = await user.accounts();
    //   expect(toState(accounts)).toMatchSnapshot()
    // });

    
    // it('Check if error log is empty', async () => {
    //   let errs = await user.get_errors();
    //   expect(toState(errs)).toStrictEqual([]);
    // });
    

    //<------------------------
    it(`configure node`, async () => {
   
    //   //1) start canister thatcontain the node object

      // const result = await user.start();

      let gna_args: NodeId = 0;
      let ret_gna = await node.get_node_addr(gna_args);
      //console.log("ret_gna:",ret_gna);


      let req : NodeRequest = {
        'controllers' : [jo.getPrincipal()],
        'destinations' : [{'ic' : {        
          'name' : 'bob',
          'ledger' : ledgerCanisterId,
          'account' : [{'owner': bob.getPrincipal(), subaccount:[]}],        
          }
        }],
        'refund' : [{'ic' : {
          'name' : 'jo',
          'ledger' :  ledgerCanisterId,
          'account' : {'owner': jo.getPrincipal(), subaccount:[]}
          }
        }],
      };

      let creq : CreateRequest = {
        'throttle' : {
          'init' : {'ledger' : ledgerCanisterId},
          'variables' : {
              'interval_sec' : {'fixed' : 2n}, 
              'max_amount' : {'fixed' : 10000000n}
            },
        },
      };

      //let cnr_ret = await node.icrc55_create_node(req, creq);
      await passTime(3);
      
      ledger.setIdentity(jo);
      node.start();
      await passTime(30);

      let cnr_ret = await node.icrc55_create_node(req, creq);
      // var source_principal:Principal = jo.getPrincipal();
      // var source_principal_sub:[] | [Uint8Array | number[]] = [];
      //console.log("cnr_ret: ", cnr_ret);
      if ('ok' in cnr_ret) {
        const aux = cnr_ret.ok;
        //console.log("sources:",aux.sources[0]);
        if ('ic' in aux.sources[0]) {
          const aux2 = aux.sources[0].ic;
          let source_principal = aux2.account.owner;
          let source_principal_sub = aux2.account.subaccount
          // console.log("account principal:",aux2.account.owner.toString());
          // console.log("sub-account:",aux2.account.subaccount.toString());
          // console.log("jo principal:",jo.getPrincipal().toString());

          // const resb = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          // console.log("before source:",resb);
          
          // const result_jo = await ledger.icrc1_balance_of({owner: jo.getPrincipal(), subaccount: []});
          // console.log("jo balance:",result_jo)

          const res_bob = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
          //console.log("balance bob:",res_bob);
                
          expect(res_bob).toBe(0n)
        
          //load some tokens in the source address:
          const res_tx = await ledger.icrc1_transfer({
            to: {owner: source_principal, subaccount:source_principal_sub},
            from_subaccount: [],
            amount: 3_0000_0000n,
            fee: [],
            memo: [],
            created_at_time: [],
          });
      
          // node.start();

          // await passTime(30);

          // console.log("res_tx:",res_tx);

          // const resa = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          // console.log("after source:",resa);
          
          // const result_joa = await ledger.icrc1_balance_of({owner: jo.getPrincipal(), subaccount: []});
          // console.log("jo balance:",result_joa)

          // const res_boba = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
          // console.log("balance bob:",res_boba);

          await passTime(10);

          // const resaa = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          // console.log("after source2:",resaa);
          
          // const result_joaa = await ledger.icrc1_balance_of({owner: jo.getPrincipal(), subaccount: []});
          // console.log("jo balance2:",result_joaa)

          const res_bobaa = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
          //console.log("balance bob2:",res_bobaa);

          expect(res_bobaa>0).toBe(true)

        }
      }
      // let i = 0n;
      // for (; i < 10; i++) {
        // const result_source = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
        // console.log("source:",result_source);
        // const result_bob = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
        // console.log("bob:",result_bob);
        // await passTime(40);
        // const result_source2 = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
        // console.log("source:",result_source2);
        // console.log("source pid:",source_principal.toString());
        // const result_bob2 = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
        // console.log("bob:",result_bob2);

      // }
    //   public type NodeRequest = {
    //     destinations : [DestinationEndpoint];
    //     refund: [Endpoint];
    //     controllers : [Principal];
    // };
    //injs
    // const NodeRequest = IDL.Record({
    //   'controllers' : IDL.Vec(IDL.Principal),
    //   'destinations' : IDL.Vec(DestinationEndpoint),
    //   'refund' : IDL.Vec(Endpoint),
    // });
    // const DestinationEndpoint = IDL.Variant({
    //   'ic' : DestICEndpoint,
    //   'remote' : DestRemoteEndpoint,
    // });
    // const DestICEndpoint = IDL.Record({
    //   'name' : IDL.Text,
    //   'ledger' : IDL.Principal,
    //   'account' : IDL.Opt(Account),
    // });
    // const Account = IDL.Record({
    //   'owner' : IDL.Principal,
    //   'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    // });
    // const ICEndpoint = IDL.Record({
    //   'name' : IDL.Text,
    //   'ledger' : IDL.Principal,
    //   'account' : Account,
    // });
    // const RemoteEndpoint = IDL.Record({
    //   'name' : IDL.Text,
    //   'platform' : IDL.Nat64,
    //   'ledger' : IDL.Vec(IDL.Nat8),
    //   'account' : IDL.Vec(IDL.Nat8),
    // });
    // const Endpoint = IDL.Variant({
    //   'ic' : ICEndpoint,
    //   'remote' : RemoteEndpoint,
    // });

      // let ac_jo: Account = {'owner': jo.getPrincipal(), subaccount:[]};
      // let icep_jo : ICEndpoint = {
      //     'name' : 'jo',
      //     'ledger' :  ledgerCanisterId,
      //     'account' : ac_jo
      // }; 
      // let ep_jo : Endpoint = {
      //     'ic' : icep_jo,
      // };
      // let ac_bob: Account = {'owner': bob.getPrincipal(), subaccount:[]};
      // let destic1 : DestICEndpoint = {        
      //     'name' : 'bob',
      //     'ledger' : ledgerCanisterId,
      //     'account' : [ac_bob]        
      // };
      // let dest1 : DestinationEndpoint = {
      //     'ic' : destic1
      // };
      // let req : NodeRequest = {
      //   'controllers' : [jo.getPrincipal()],
      //   'destinations' : [dest1],
      //   'refund' : [ep_jo]
      // };

      // let req : NodeRequest = {
      //   'controllers' : [jo.getPrincipal()],
      //   'destinations' : [{'ic' : {        
      //     'name' : 'bob',
      //     'ledger' : ledgerCanisterId,
      //     'account' : [{'owner': bob.getPrincipal(), subaccount:[]}],        
      //     }
      //   }],
      //   'refund' : [{'ic' : {
      //     'name' : 'jo',
      //     'ledger' :  ledgerCanisterId,
      //     'account' : {'owner': jo.getPrincipal(), subaccount:[]}
      //     }
      //   }],
      // };

      // let creq : CreateRequest = {
      //   'throttle' : {
      //     'init' : {'ledger' : ledgerCanisterId},
      //     'variables' : {
      //         'interval_sec' : {'fixed' : 2n}, 
      //         'max_amount' : {'fixed' : 100n}
      //       },
      //   },
      // };

      // let cnr_ret = await node.icrc55_create_node(req, creq);
      // await passTime(3);

    //   public type CreateRequest = {
    //     #throttle : ThrottleVector.CreateRequest;
    //     #lend: Lend.CreateRequest;
    //     #borrow: Borrow.CreateRequest;
    //     #exchange: Exchange.CreateRequest;
    //     #escrow: Escrow.CreateRequest;
    //     #split: Split.CreateRequest;
    //     #mint: Mint.CreateRequest;
    //     //...
    // };
    //ThrottleVector.CreateRequest;
    // public type CreateRequest = {
    //   init : {
    //       ledger : Principal;
    //   };
    //   variables : {
    //       interval_sec : NumVariant;
    //       max_amount : NumVariant;
    //   };
    //  };
    //in js
    // const CreateRequest__7 = IDL.Record({
    //   'init' : IDL.Record({ 'ledger' : IDL.Principal }),
    //   'variables' : IDL.Record({
    //     'interval_sec' : NumVariant,
    //     'max_amount' : NumVariant,
    //   }),
    // });
    // const NumVariant = IDL.Variant({
    //   'rnd' : IDL.Record({ 'max' : IDL.Nat64, 'min' : IDL.Nat64 }),
    //   'fixed' : IDL.Nat64,
    // });
      // let creq_thr : CreateRequest__7 = {
      //     'init' : {'ledger' : ledgerCanisterId},
      //     'variables' : {
      //         'interval_sec' : {'fixed' : 2n}, 
      //         'max_amount' : {'fixed' : 100n}
      //       },
      // };
      // let creq : CreateRequest = {
      //   'throttle' : creq_thr,
      // };

      // let creq : CreateRequest = {
      //   'throttle' : {
      //     'init' : {'ledger' : ledgerCanisterId},
      //     'variables' : {
      //         'interval_sec' : {'fixed' : 2n}, 
      //         'max_amount' : {'fixed' : 100n}
      //       },
      //   },
      // };
    //   public type CreateNodeResp<A> = {
    //     #ok : NodeShared<A>;
    //     #err : Text;
    // };
    //In js:
    //{'throttle' : CreateRequest__7,}
    // const CreateRequest__7 = IDL.Record({
    //   'init' : IDL.Record({ 'ledger' : IDL.Principal }),
    //   'variables' : IDL.Record({
    //     'interval_sec' : NumVariant,
    //     'max_amount' : NumVariant,
    //   }),
    // });
     
      
      // node.start();
      
      // await passTime(3);
      // var source_principal:Principal = jo.getPrincipal();
      // var source_principal_sub:[] | [Uint8Array | number[]] = [];
      // console.log("cnr_ret: ", cnr_ret);
      // if ('ok' in cnr_ret) {
      //   const aux = cnr_ret.ok;
      //   console.log("sources:",aux.sources[0]);
      //   if ('ic' in aux.sources[0]) {
      //     const aux2 = aux.sources[0].ic;
      //     source_principal = aux2.account.owner;
      //     source_principal_sub = aux2.account.subaccount
      //     console.log("account principal:",aux2.account.owner.toString());
      //     console.log("sub-account:",aux2.account.subaccount.toString());
      //     console.log("jo principal:",jo.getPrincipal().toString());
      //   }
      // }

      // await passTime(3);
      
      // const resb = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
      // console.log("before source:",resb);

      // //load some tokens in the source address:
      // const result = await ledger.icrc1_transfer({
      //   to: {owner: source_principal, subaccount:source_principal_sub},
      //   from_subaccount: [],
      //   amount: 3_0000_0000n,
      //   fee: [],
      //   memo: [],
      //   created_at_time: [],
      // });

      // await passTime(3);
      
      // const resa = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
      // console.log("after source:",resa);

      // 100060000000
      // 99760000000
      
      // console.log("ledger pid:",ledgerCanisterId.toString() );
      // console.log("nodecanisterid pid:",nodeCanisterId.toString());
      // console.log("userCanisterId:",userCanisterId.toString());
      // console.log("jo pId:",jo.getPrincipal().toString());
      // console.log("bob pId:",bob.getPrincipal().toString());
      // await passTime(1);
      // const result = await user.start();
      //node.start();
      // await passTime(2);

      // await passTime(100);
      // Check balance of BOB is increasing every 2 seconds<------------------
      // const result = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
      // let i = 0n;
      // for (; i < 10; i++) {
        // const result_source = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
        // console.log("source:",result_source);
        // const result_bob = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
        // console.log("bob:",result_bob);
        //await passTime(4);
      // }
      //expect(toState(result)).toBe("100000000")
      // await passTime(3);
      // const result2 = await user.get_info();
      // expect(toState(result2.last_indexed_tx)).toBe("2");
    },600*1000);


    it(`split test`, async () => {
      // const result_source2 = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
      // console.log("source:",result_source2);
      // console.log("source pid:",source_principal.toString());
      // console.log("bob pid:",bob.getPrincipal().toString());
      // const result_bob2 = await ledger.icrc1_balance_of({owner: bob.getPrincipal(), subaccount: []});
      // console.log("bob:",result_bob2);
      let req : NodeRequest = {
        'controllers' : [jo.getPrincipal()],
        'destinations' : [
          {'ic' : {        
            'name' : 'ali',
            'ledger' : ledgerCanisterId,
            'account' : [{'owner': ali.getPrincipal(), subaccount:[]}],        
          }},
          {'ic' : {        
          'name' : 'ali2',
          'ledger' : ledgerCanisterId,
          'account' : [{'owner': ali2.getPrincipal(), subaccount:[]}],        
          }},
        ],
        'refund' : [{'ic' : {
          'name' : 'jo',
          'ledger' :  ledgerCanisterId,
          'account' : {'owner': jo.getPrincipal(), subaccount:[]}
          }
        }],
      };

      let creq_split : CreateRequest = {
        'split' : {
          'init' : {'ledger' : ledgerCanisterId},
          'variables' : {
              'split' : [50n,50n], // [50,50] is the default in "split.mo" 
            },
        },
      };
      


      //let cnr_ret = await node.icrc55_create_node(req, creq);
      await passTime(3);
      
      ledger.setIdentity(jo);
      node.start();
      await passTime(30);

      let cnr_ret = await node.icrc55_create_node(req, creq_split);

      if ('ok' in cnr_ret) {
        const aux = cnr_ret.ok;
        //console.log("sources:",aux.sources[0]);
        if ('ic' in aux.sources[0]) {
          const aux2 = aux.sources[0].ic;
          let source_principal = aux2.account.owner;
          let source_principal_sub = aux2.account.subaccount
          // console.log("account principal:",aux2.account.owner.toString());
          // console.log("sub-account:",aux2.account.subaccount.toString());
          // console.log("jo principal:",jo.getPrincipal().toString());

          // const resb = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          // console.log("before source:",resb);
          
          // const result_jo = await ledger.icrc1_balance_of({owner: jo.getPrincipal(), subaccount: []});
          // console.log("jo balance:",result_jo)
          
          const resa = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          console.log("before source:",resa);

          const res_ali = await ledger.icrc1_balance_of({owner: ali.getPrincipal(), subaccount: []});
          console.log("balance ali:",res_ali);

          const res_bob = await ledger.icrc1_balance_of({owner: ali2.getPrincipal(), subaccount: []});
          console.log("balance ali2:",res_bob);
                
          expect(resa).toBe(0n)
          expect(res_ali).toBe(0n)
        
          //load some tokens in the source address:
          const res_tx = await ledger.icrc1_transfer({
            to: {owner: source_principal, subaccount:source_principal_sub},
            from_subaccount: [],
            amount: 3_0000_0000n,
            fee: [],
            memo: [],
            created_at_time: [],
          });
          await passTime(1);

          const resaaa = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          console.log("after source:",resaaa);

          // node.start();

          await passTime(10);

          // console.log("res_tx:",res_tx);

          const resaa = await ledger.icrc1_balance_of({owner: source_principal, subaccount: source_principal_sub});
          console.log("after source:",resaa);
          
          const res_alia = await ledger.icrc1_balance_of({owner: ali.getPrincipal(), subaccount: []});
          console.log("ali balance:",res_alia)

          const res_bobaa = await ledger.icrc1_balance_of({owner: ali2.getPrincipal(), subaccount: []});
          console.log("ali2 balance:",res_bobaa);

          expect(res_alia>0).toBe(true)
          expect(res_bobaa>0).toBe(true)

        }
      }

    });

    it(`throttle->split test`, async () => {     
      
      let req_split : NodeRequest = {
        'controllers' : [jo.getPrincipal()],
        'destinations' : [
          {'ic' : {        
            'name' : 'ali',
            'ledger' : ledgerCanisterId,
            'account' : [{'owner': ali.getPrincipal(), subaccount:[]}],        
          }},
          {'ic' : {        
          'name' : 'ali2',
          'ledger' : ledgerCanisterId,
          'account' : [{'owner': ali2.getPrincipal(), subaccount:[]}],        
          }},
        ],
        'refund' : [{'ic' : {
          'name' : 'jo',
          'ledger' :  ledgerCanisterId,
          'account' : {'owner': jo.getPrincipal(), subaccount:[]}
          }
        }],
      };

      let creq_split : CreateRequest = {
        'split' : {
          'init' : {'ledger' : ledgerCanisterId},
          'variables' : {
              'split' : [50n,50n], // [50,50] is the default in "split.mo" 
            },
        },
      };



      //await passTime(30);

      //let cnr_trt = await node.icrc55_create_node(req_throttle, creq_throttle);
      let cnr_spt = await node.icrc55_create_node(req_split, creq_split);

      if ('ok' in cnr_spt) {//<--- IM here
        // I need to source of split = bob (destination of throttle)
        // I need to transfer token to source of throtle
        const aux_spt = cnr_spt.ok;
        //console.log("souaux_spt.sources[0]);

        if ('ic' in aux_spt.sources[0]) {
          const aux2 = aux_spt.sources[0].ic;
          const source_principal = aux2.account.owner;
          const source_principal_sub = aux2.account.subaccount

          let req_throttle : NodeRequest = {
            'controllers' : [jo.getPrincipal()],
            'destinations' : [{'ic' : {        
              'name' : 'bob',
              'ledger' : ledgerCanisterId,
              'account' : [{'owner': source_principal, subaccount:source_principal_sub}],        
              }
            }],
            'refund' : [{'ic' : {
              'name' : 'jo',
              'ledger' :  ledgerCanisterId,
              'account' : {'owner': jo.getPrincipal(), subaccount:[]}
              }
            }],
          };
  
          let creq_throttle : CreateRequest = {
            'throttle' : {
              'init' : {'ledger' : ledgerCanisterId},
              'variables' : {
                  'interval_sec' : {'fixed' : 2n}, 
                  'max_amount' : {'fixed' : 10000000n}
                },
            },
          };

          let cnr_trt = await node.icrc55_create_node(req_throttle, creq_throttle);
        
          if ('ok' in cnr_trt) {
            const aux = cnr_trt.ok;
            //console.log("sources:",aux.sources[0]);
            if ('ic' in aux.sources[0]) {
              const aux2 = aux.sources[0].ic;
              let source_trt_principal = aux2.account.owner;
              let source_trt_principal_sub = aux2.account.subaccount
    
              const resb = await ledger.icrc1_balance_of({owner: source_trt_principal, subaccount: source_trt_principal_sub});
              console.log("before source trt:",resb);
                                
              //load some tokens in the trt source address:
              const res_tx = await ledger.icrc1_transfer({
                to: {owner: source_trt_principal, subaccount:source_trt_principal_sub},
                from_subaccount: [],
                amount: 13_0000_0000n,
                fee: [],
                memo: [],
                created_at_time: [],
              });

              await passTime(150);
            
              const res_alia = await ledger.icrc1_balance_of({owner: ali.getPrincipal(), subaccount: []});
              console.log("ali balance:",res_alia)

              const res_bobaa = await ledger.icrc1_balance_of({owner: ali2.getPrincipal(), subaccount: []});
              console.log("ali2 balance:",res_bobaa);

              expect(res_alia+res_bobaa>12_0000_0000).toBe(true)
            };
          };
        };
      };
    });


    async function passTime(n:number) {
    for (let i=0; i<n; i++) {
        await pic.advanceTime(3*1000);
        await pic.tick(2);
      }
    }

});