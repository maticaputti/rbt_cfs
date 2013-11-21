#!/usr/bin/env node
/**
 * Created by Kanthanarasimhaiah on 14/11/13.
 */

var binarytree = require('./binarytree'),
    rbt = require('./rbt.js');

// Run CFS algorithm
function runCFS(tasks, timeline) {
    // queue of tasks sorted in start_time order
    var time_queue = tasks.task_queue;
    // index into time_queue of the next nearest task to start
    var time_queue_idx = 0;

    // min_vruntime is set to the smallest vruntime of tasks on the
    // timeline
    var min_vruntime = 0;

    // current running task or null if no tasks are running.
    var running_task = null;


    // Initialize statistics gathering
    var results = {time_data: []};
    var start_ms = new Date().getTime();
    binarytree.RESET_STATS();

    // Loop from time/tick 0 through the total time/ticks specified
    for(var curTime=0; curTime < tasks.total_time; curTime++) {
    
        // Results data for this time unit/tick
        var tresults = {running_task: null,
                        completed_task: null};

        // Check tasks at the beginning of the task queue. Add any to
        // the timeline structure when the start_time for those tasks
        // has arrived.
        while (time_queue_idx < time_queue.length &&
               (curTime >= time_queue[time_queue_idx].start_time)) {
            var new_task = time_queue[time_queue_idx++];
            // new tasks get their vruntime set to the current
            // min_vruntime
            new_task.vruntime = min_vruntime;
            new_task.truntime = 0;
            new_task.actual_start_time = curTime;
            timeline.insert(new_task);
        }

        // If there is a task running and its vruntime exceeds
        // min_vruntime then add it back to the timeline. Since
        // vruntime is greater it won't change min_vruntime when it's
        // added back to the timeline.
        if (running_task && (running_task.vruntime > min_vruntime)) {
            timeline.insert(running_task);
            running_task = null;
        }

        // If there is no running task (which may happen right after
        // the running_task is added back to the timeline above), find
        // the task with the smallest vruntime on the timeline, remove
        // it and set it as the running_task and determine the new
        // min_vruntime.
        if (!running_task && timeline.size() > 0) {
            var min_node = timeline.min();
            running_task = min_node.val;
            timeline.remove(min_node);
            if (timeline.size() > 0) {
                min_vruntime = timeline.min().val.vruntime
            }
        }

        tresults.num_tasks = timeline.size() + (running_task ? 1 : 0);

        // Update the running_task (if any) by increasing the vruntime
        // and the truntime. If the running task has run for it's full
        // duration then report it as completed and set running_task
        // to null.
        if (running_task) {
            running_task.vruntime++;
            running_task.truntime++;
            tresults.running_task = running_task;
            //console.log(curTime + ": " + running_task.id);
            if (running_task.truntime >= running_task.duration) {
                running_task.completed_time = curTime;
                tresults.completed_task = running_task
                running_task = null;
                //console.log("Completed task:", running_task.id);
            }
        }

        results.time_data[curTime] = tresults;
    }

    //binarytree.RESET_STATS();
    results.node_stats = binarytree.GET_STATS();
    results.elapsed_ms = (new Date().getTime())-start_ms;

    return results;
}

function generate_report(tasks, results, detailed) {
    var reads = 0, writes = 0, total = 0, completed = 0;

    // General info on the original tasks
    console.log("Numer of Tasks:", tasks.num_of_tasks);
    console.log("Total Time:", tasks.total_time);

    if (detailed) {
        console.log("Task Queue:");
        console.log(tasks.task_queue);
    }

    // A chronological summary of the state at each time
    if (detailed) {
        console.log("\ntime [tasks]: running_task, completed?");
        for (var i=0; i < results.time_data.length; i++) {
            var t = results.time_data[i],
                msg = "  " + i + " [" + t.num_tasks + "]: ";
            if (t.running_task) {
                msg += t.running_task.id;
            }
            if (t.completed_task) {
                msg += ", Completed";
                completed++;
            }
            console.log(msg);
        }
    }

    // Sum all the reads and writes
    for (var r in results.node_stats.read) {
        reads += results.node_stats.read[r];
    }
    for (var r in results.node_stats.write) {
        writes += results.node_stats.write[r];
    }
    total = reads+writes;

    // Report summary statistics
    console.log("Wallclock elapsed time: " + results.elapsed_ms + "ms")
    console.log("Node operations reads  : " + reads);
    console.log("                writes : " + writes);
    console.log("                total  : " + total);
    console.log("Throughput:", (completed/results.elapsed_ms), "completed tasks/ms");
    console.log("           ", (completed/total), "completed tasks/operation");
    //console.log("Tasks per tick:", tasks_per_tick);
}

if (require.main === module) {
    // we are being run directly so load the task file specified on
    // the command line pass the data to runCFS using an RedBlackTree
    // for the timeline
    if (process.argv.length < 3) {
        console.log("cfs TASK_FILE");
        process.exit(2);
    }

    var tasksModule = require('./tasks');
    var fileName = process.argv[2];
    var tasks = tasksModule.readTasks(fileName);

    var timeline = new rbt.RBT(function (a, b) {
            return a.val.vruntime - b.val.vruntime; });

    // Run the CFS algorithm and generate a results report
    var results = runCFS(tasks, timeline);
    generate_report(tasks, results);

} else {
    // we are being required as a module so export the runCFS function
    exports.runCFS = runCFS;
}
