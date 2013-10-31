"use strict";

var binarytree = require('./binarytree'),
    NIL = binarytree.NIL;

function log2(num) {
    return Math.log(num) / Math.log(2);
}

// heapGetLast: Find the last element in the tree based on size.
// Returns a tuple of the last element and the parent of the last
// element.
function heapGetLast(tree, size) {
    if (size === 0) {
        return null;
    } else {
        var parent = tree.p,
            height = Math.floor(log2(size)) + 1,
            sz1 = Math.max(0, (2 << (height - 3)) - 1),
            sz2 = (2 << (height - 2)) - 1,
            sz3 = (2 << (height - 1)) - 1,
            flipAt = (sz2 + sz3) / 2;
        while (size > 1) {
            //console.log("height:", height, "size:", size, "flipAt:", flipAt);
            //console.log("sz1:", sz1, "sz2:", sz2, "sz3:", sz3);
            if (size <= flipAt) {
                //console.log("L");
                parent = tree;
                tree = tree.left;
                size = size - (sz1 + 1);
            } else {
                //console.log("R");
                parent = tree;
                tree = tree.right;
                size = size - (sz2 + 1);
            }
            var new_height = Math.floor(log2(size)) + 1
            if (new_height < height) {
                height = new_height;
                sz3 = sz2;
                sz2 = sz1;
                sz1 = Math.max(0, (2 << (height - 3)) - 1);
                flipAt = (sz2 + sz3) / 2;
            }
        }
        return [tree, parent];
    }
}

// heapBubbleDown: bubble down node in tree.
function heapBubbleDown(tree, node, type, compareFn) {
    if (typeof compareFn === 'undefined') {
        compareFn = binarytree.defaultCompareFn;
    }
    if (type === 'max') {
        origCompareFn = compareFn;
        compareFn = function(n1, n2) { return - origCompareFn; };
    }

    while (true) {
        var pickChild = null;
        if (node.left !== NIL && node.right !== NIL) {
            if (compareFn(node.left, node.right) > 0) {
                pickChild = node.right;
            } else {
                pickChild = node.left;
            }
        } else if (node.left !== NIL) {
            pickChild = node.left;
        } else {
            break;
        }

        if (compareFn(node, pickChild) < 0) {
            break;
        } else {
            tree = binarytree.treeSwap(tree, node, pickChild);
        }
    }
    return tree;
}

// heapBubbleUp: bubble up node in tree.
function heapBubbleUp(tree, node, type, compareFn) {
    if (typeof compareFn === 'undefined') {
        compareFn = binarytree.defaultCompareFn;
    }
    if (type === 'max') {
        origCompareFn = compareFn;
        compareFn = function(n1, n2) { return - origCompareFn; };
    }

    while (node.p !== NIL) {
        if (compareFn(node.p, node) < 0) {
            break;
        } else {
            tree = binarytree.treeSwap(tree, node.p, node);
        }
    }
    return tree;
}

// heapInsert: insert node into the tree
function heapInsert (tree, size, node, type, compareFn) {
    if (typeof compareFn === 'undefined') {
        compareFn = binarytree.defaultCompareFn;
    }

    if (tree === NIL) {
        return node;
    }

    // Get the parent of the next last element
    var np = heapGetLast(tree, size + 1),
        parent = np[1];

    // Add the new node to the last position
    if (parent.left === NIL) {
        parent.left = node;
    } else {
        parent.right = node;
    }
    node.p = parent;

    // Bubble up the new node to its position
    tree = heapBubbleUp(tree, node, type, compareFn);

    return tree;
}

// heapRemove: remove the top element from tree
function heapRemove (tree, size, type, compareFn) {
    if (typeof compareFn === 'undefined') {
        compareFn = binarytree.defaultCompareFn;
    }

    if (size === 1) {
        return NIL;
    }

    var remove = tree,
        np = heapGetLast(tree, size),
        last = np[0],
        lparent = np[1];

    // Swap the top and last elements
    tree = binarytree.treeSwap(tree, remove, last);

    // Remove the new last element
    if (remove.p.left === remove) {
        remove.p.left = NIL;
    } else {
        remove.p.right = NIL;
    }
    remove.p = NIL;

    // Bubble down the top node to its right position
    tree = heapBubbleDown(tree, tree, type, compareFn);

    return tree;
}



// Heap: 
//   - Constructor: new HeapTree (type, cmpFn) - create/construct
//     a new Heap binary tree object. The type can be either 'min' or
//     'max' to create a MinHeap or MaxHeap. If cmpFn is not provided
//     then a numeric comparison is done on nodeX.val.
//   - API/Methods: all BinaryTree methods plus insert and remove
//     (remove top) specific to heaps.
function HeapTree (type, cmpFn) {
    var self = this,
        api;
    // call parent/super constructor
    api = binarytree.BinaryTree.call(self, cmpFn);

    if (type === 'min') {
        api.min = function() { return self.root; };
    } else if (type === 'max') {
        api.max = function() { return self.root; };
    } else {
        throw new Error("Heap type must be 'min' or 'max'");
    }
    self.removeFn = function(tree, node) {
        return heapRemove(tree, self.size, type, cmpFn);
    }
    self.insertFn = function(tree, node, compareFn) {
        return heapInsert(tree, self.size, node, type, compareFn);
    }


    // Return the API functions (public interface)
    return api;
}

exports.heapGetLast = heapGetLast;
exports.heapBubbleUp = heapBubbleUp;
exports.heapBubbleDown = heapBubbleDown;
exports.heapInsert = heapInsert;
exports.heapRemove = heapRemove;
exports.HeapTree = HeapTree;
