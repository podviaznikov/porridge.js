// (c) 2011 Enginimation Studio (http://enginimation.com).
// porridge.js may be freely distributed under the MIT license.
"use strict";
var global = this;
//browsers API
var indexedDB = global.indexedDB || global.webkitIndexedDB;
var IDBTransaction = global.IDBTransaction || global.webkitIDBTransaction;
var IDBKeyRange = global.IDBKeyRange || global.webkitIDBKeyRange;
var Porridge={
    version:'0.3',
    db:null,
    log:function(e){
        console.log(e);
    },
    info:function(e){
        console.info(e);
    },
    init:function(config,handleSuccess,handleError){
        var request = indexedDB.open(config.dbName,config.dbDescription),
            version = config.dbVersion;
        request.onsuccess = function(e){
            var db = e.target.result;
            Porridge.db = db;
            // We can only create Object stores in a setVersion transaction;
            if(version!= db.version){
                var setVersionReq = db.setVersion(version);
                // onsuccess is the only place we can create Object Stores
                setVersionReq.onfailure = handleError||Porridge.log;
                setVersionReq.onsuccess = function(e){
                    var i = 0,k = 0;
                    //create store store
                    for(;i<config.stores.length;i++){
                        var storeDef = config.stores[i],
                            store = db.createObjectStore(storeDef.name,storeDef.key,true);
                        if(storeDef.indexes){
                            for(;k<storeDef.indexes.length;k++){
                                var indexDef=storeDef.indexes[k];
                                store.createIndex(indexDef.name, indexDef.field||indexDef.name);
                            }
                        }
                    }
                    Porridge.log('initialized db');
                    handleSuccess();
                };
            }else{
                handleSuccess();
            }

        };
        request.onfailure = handleError||this.log;
    },
    all:function(entityName,handleOne,handleAll,handleError){
        var trans = this.db.transaction([entityName], IDBTransaction.READ_WRITE, 0),
            store = trans.objectStore(entityName),
        // Get everything from the store;
            request = store.openCursor();

        request.onsuccess = function(e){
            var cursor = e.result ||       // The cursor is either in the event
                e.target.result;           // ...or in the request object.
            if (!cursor){                   // No cursor means no more results
                if(handleAll){           //execute callback when all records retrieved
                    handleAll();
                }
                return;
            }
            var object = cursor.value;      // Get the matching record
            handleOne(object);              // Pass it to the callback
            cursor.continue();             // Ask for the next matching record
        };
        request.onerror = handleError||this.log;
    },
    save:function(entityName,entity,key,handleError){
        var trans = this.db.transaction([entityName], IDBTransaction.READ_WRITE, 0),
            store = trans.objectStore(entityName),
            request = store.put(entity,key);

        request.onsuccess = Porridge.info;
        request.onerror = handleError||this.log;
    },
    remove:function(entityName,id,success,handleError){
        var trans = this.db.transaction([entityName], IDBTransaction.READ_WRITE, 0),
            store = trans.objectStore(entityName),
            request = store.delete(id);

        request.onsuccess = success;
        request.onerror = handleError||this.log;
    },
    allByKey:function(entityName,keyName,keyValue,handleOne,handleAll,handleError){
        var trans = this.db.transaction([entityName], IDBTransaction.READ_WRITE, 0),
            store = trans.objectStore(entityName),
            index = store.index(keyName),
            range = new IDBKeyRange.only(keyValue),
        // Get everything in the store;
            request = index.openCursor(range);

        request.onsuccess = function(e){
            var cursor = e.result ||       // The cursor is either in the event
                e.target.result;           // ...or in the request object.
            if (!cursor){                  // No cursor means no more results
                if(handleAll){              //execute callback when all records retrieved
                    handleAll();
                }
                return;
            }
            var object = cursor.value;      // Get the matching record
            handleOne(object);            // Pass it to the callback
            cursor.continue();             // Ask for the next matching record
        };

        request.onerror = handleError||this.log;
    }
}
