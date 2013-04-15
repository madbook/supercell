
###

1. create the grid of cells
2. create two grids of supercells, offset by 1 cell on both axis
3. 16 unique supercells are cached.  for each cached supercell, 12 values are
   stored (each single cell state, and each combination of 2 or three
   orthagonally adjacent cells)
4. on each tick, we swap the active supercell grid and use it to calculate the
   inactive one.  we use 2x2 blocks of supercells (dupercells?) and calculate
   the inner supercell.  We cache the results of each of these lookups too, for
   a maximum of 16^4 (65,536) unique values.
5. game update loop and render loop are independent, at small sizes game can
   update much faster than 60fps

to do

6. for each supercell grid, keep a corresponding 'active state' grid.  whenever a
   supercell changes state, the four cells on the opposite grid that it overlaps
   are flagged for update.  whenever it does not change state, it is unflagged
7. for each supercell grid, keep a corresponding 'update' array.  this array contains
   the ids of the cells to update. every turn this is rebuilt, and we use the
   'active state' flag to determine quickly if we can add a newly flagged cell
   into this array.  ids are only added into the inactive array, and are removed
   from the array simply by not pushing them into the new array the next time
   that grid is updated.  The fact that we are using swapping between two arrays
   means that we will also stop calculating isolated 2-state repeating patterns

0 grid              1 grid
i0 updates i1       i0 updates i1

 ————— —————        A—————C—————
|0    |     |       |0    |     |
| *X—————c  |       | *a—————c  |
|  |     |  |       |  |     |  |
 ——| =0  |——|       B——| =D  |——|
|  |     |  |       |  |     |  |
|  b—————d  |       |  b—————d  |
|     |    1|       |     |    1|
 ————— —————         ————— —————

(x,y) always updates (x+i, y+i)
1-i = opposite grid
if the inner cell is updated, we need to flag the cell that updates it (top left)
to update again next turn
    X = 1-i(x-i, y-i)
we also need to update the cells
on the ACTIVE grid that updates each cell on the inactive grid  that updates
the current cell (yes it's that complicated)
    A = i(x-1, y-1)
    B = i(x-1, y)
    C = i(x, y-1)
    D = i(x, y) <- current cell
we also still need to push in the X cell!

the complication arises because ABCD supercells are on the *same* grid as the
currently being updated grid (which should be the (B)uffer grid at the time)
while the X supercell is on the *opposite* grid of the one being updated (which
would be the *current* grid, or the (A)ctive grid)

we can't modify the [A] grid while we are looping through it, so we need
to detatch it first.  we should be able to erase it and start from scratch, as
each item can only be added this way once per loop

we *do* have to keep track of what we add to the buffer grid.  This is the [A]
list from the previous turn, so we should already have a bunch of cells in here
from that.  The [B] grid is the grid we are updating, not the grid we are looping
over.  in addition to possibly being in ther from the previous turn, each supercell
has the potential of getting added 4 more times during this loop, so we need to
know what is in the [B] grid.

We do this by creating an [A Update] array that keeps track of wether or not each
cell is in the [A] array.  it is reset whenever the [A] array is reset.



instead of storing supercell data as string properties, store them
by using its decimal value

(a*8) + (b*4) + (c*2) + d

Internally, it should be the same performance, but
it means we can always access that supercell directly becuase its index will
be its name (right?)

then, in the supercells array, we can store a compact list of the ids that this
cell will always point to, instead of trying to figure that out every time.  we
can use a typed array, since the highest id will be 65536, we can use Int16Array

no
what it really needs

###



class Game

    constructor : (@w, @h, cells) ->
        if cells?
            @cells = cells
        else
            @cells = []
            @makeCells()

        @supercellCache = {}
        @supercellResultCache = {}
        @supercellGrids = []

        @_i = 0
        @w2 = @w / 2
        @h2 = @h / 2

        @getSupercellGrid(0, 0)
        @getSupercellGrid(1, 1)
        @cells = undefined

        # @supercellActiveCells = @.supercellGrids[1].activeCells
        # @supercellActiveUpdates = @.supercellGrids[1].activeFlags
        @supercellBufferCells = @.supercellGrids[0].activeCells
        @supercellBufferUpdates = @.supercellGrids[0].activeFlags

        @empty = @getOrCreateSupercell(0,0,0,0)
        @supercells = @supercellGrids[0].supercells


        @canvas = document.getElementById('thecanvas')
        @canvas.height = @h
        @canvas.width = @w
        @ctx = @canvas.getContext('2d')
        @ctx.fillStyle = '#000'
        @canvas.style.backgroundColor = '#FFF'

        @ctx.fillRect(0, 0, @w, @h)
        @imageDataObject = @ctx.getImageData(0, 0, @w, @h)
        @rendered = false
        # document.body.appendChild(@canvas)

    # create cell data
    makeCells: ->
        cells = []
        for y in [0...@h]
            for x in [0...@w]
                if y < 2 or x < 2
                    cells.push(0)
                else
                    cells.push(Math.round(Math.random() * 0.54))
                    # cells.push(1)
        @cells = cells

    i: (x, y) -> (y * @w) + x

    swapPointer: ->
        i = @_i #1
        buffer = @supercellGrids[i] # +2 = 3
        @supercellBuffer = buffer.supercells # + 2 = 5

        i = 1 - i
        active = @supercellGrids[i] # + 2 = 7
        @supercells = active.supercells # + 2 = 9



        @supercellCurrentCells = @supercellBufferCells # +2 = 11     # current loop
        @supercellBufferCells = [] # +1 = 12 # updates on the buffer grid (x4)

        @supercellCurrentUpdates = @supercellBufferUpdates # +2 = 14 # A -> B -> C
        newUpdates = new ArrayBuffer(@w2*@h2) # +2 = 16
        @supercellBufferUpdates = new Uint8Array(newUpdates) # +1 = 17 # loop through C

        @_i = i # +1 = 18

    # function that returns cell data at x,y coordinate
    at : (x, y) ->
        if x >= @w or x < 0 or y >= @h or y < 0 then return 0
        return cells[@i(x, y)]

    atIndex: (i) ->
        cell = @cells[i]
        if cell? then return cell else return 0

    # create a cache for supercells, 2x2 cell paterns


    # each supercell is named from the string concatenation of its cell values
    getSupercellName: (a, b, c, d) -> '' + a + b + c + d

    createSupercell: (name, a, b, c, d) ->
        sc =
            name: name
            values: [
                a, b, c, d,
                a+b, b+d, c+a, d+c,
                a+b+c, b+d+a, c+a+d, d+c+b
            ]

    getOrCreateSupercell: (a, b, c, d) ->
        name = @getSupercellName(a, b, c, d)
        cached = @supercellCache[name]
        if cached? then return cached

        create = @createSupercell(name, a, b, c, d)

        @supercellCache[name] = create
        return create

    # loop through the cell grid and create a supercell grid, an array that
    # only stores the names of the supercells
    getSupercellGrid : (iO = 0) ->
        supercells = []
        activeFlags = []
        activeCells = []

        h2 = @h2
        w2 = @w2
        for y in [0...h2]
            y2 = (y * 2) + iO
            y3 = y2 + 1
            for x in [0...w2 ]
                x2 = (x * 2) + iO
                x3 = x2 + 1

                i = (y * w2) + x

                iA = @i(x2, y2)
                iB = @i(x2, y3)
                iC = @i(x3, y2)
                iD = @i(x3, y3)

                vA = @atIndex(iA)
                vB = @atIndex(iB)
                vC = @atIndex(iC)
                vD = @atIndex(iD)



                a = i
                b = if y + 1 < h2 then i + w2 else null
                c = if x + 1 < w2 then i + 1 else null
                d = if x + 1 < w2 and b? then b + 1 else null

                xi = x - (1 - iO)
                yi = y - (1 - iO)


                aa = (yi * w2) + xi
                bb = aa + w2
                ai = if xi > -1 and yi > -1 then aa else null
                bi = if xi > -1 and yi + 1 < h2 then bb else null
                ci = if xi + 1 < w2 and yi > -1 then aa + 1 else null
                di = if xi + 1 < w2 and yi + 1 < h2 then bb + 1 else null

                theCell = @getOrCreateSupercell(vA, vB, vC, vD)
                theCellPointer =
                    # the current supercell object at this location
                    supercell: theCell
                    # the ids of the cell pointers that are relavent to this one
                    a : a
                    b : b
                    c : c
                    d : d
                    ai : ai
                    bi : bi
                    ci : ci
                    di : di

                if false is true
                    console.log theCellPointer
                    console.log i, x, y, a, b, c, d
                    console.log aa, bb
                    console.log iO, xi, yi, ai, bi, ci, di

                # supercells.push(theCell)
                supercells.push(theCellPointer)
                activeFlags.push(1)
                activeCells.push(i)

        @supercellGrids.push({
            supercells: supercells
            activeFlags: activeFlags
            activeCells: activeCells
        })
        return undefined

    cacheSupercellGridNeighbors : ->
        grids = @supercellGrids
        for grid, i in grids
            b = 1 - i
            buffer = grids[b]
            cells = grid.supercells
            bufferCells = buffer.supercells
            for cell in cells
                cell.A = if cell.a? then cells[cell.a] else null
                cell.B = if cell.b? then cells[cell.b] else null
                cell.C = if cell.c? then cells[cell.c] else null
                cell.D = if cell.d? then cells[cell.d] else null
                cell.Ai = if cell.ai? then bufferCells[cell.ai] else null
                cell.Bi = if cell.bi? then bufferCells[cell.bi] else null
                cell.Ci = if cell.ci? then bufferCells[cell.ci] else null
                cell.Di = if cell.di? then bufferCells[cell.di] else null
        return


    getCellResultFromNeighbors : (cell, neighbors) ->
        score = 0
        for n in neighbors
            score += n
        if cell
            if score < 2 or score > 3
                return 0
            return 1
        else
            if score == 3
                return 1
            return 0

    # gets the supercell that will exist in the next step in the center of
    # the four provided supercells (should be supercell objects)
    getSupercellResult: (A, B, C, D) ->
        name = A.name + B.name + C.name + D.name # +4
        cache = @supercellResultCache[name] # +2
        if cache? then return cache # if cached, +6

        Av = A.values # +1
        Bv = B.values # +1
        Cv = C.values # +1
        Dv = D.values # +1

        av = 0
        bv = 0
        cv = 0
        dv = 0

        a = Av[3] # +1
        b = Bv[2] # +1
        c = Cv[1] # +1
        d = Dv[0] # +1

        # get the start state of the inner supercell
        current = @getOrCreateSupercell(a, b, c, d)

        # things are about to get ugly...
        # get each single cell value in 2-5 lookups
        av = Bv[6] + Cv[4]
        if av > 3
            a = 0
        else
            av += Av[8]
            if av > 3
                a = 0
            else
                if a
                    if av < 1
                        a = 0
                    else
                        av += Dv[0]
                        if av < 2 or av > 3
                            a = 0
                        else
                            a = 1
                else
                    if av < 2
                        a = 0
                    else
                        av += Dv[0]
                        if av == 3
                            a = 1
                        else
                            a = 0

        bv =  Av[5] + Dv[4]
        if bv > 3
            b = 0
        else
            bv += Bv[9]
            if bv > 3
                b = 0
            else
                if b
                    if bv < 1
                        b = 0
                    else
                        bv += Cv[1]
                        if bv < 2 or bv > 3
                            b = 0
                        else
                            b = 1
                else
                    if bv < 2
                        b = 0
                    else
                        bv += Cv[1]
                        if bv == 3
                            b = 1
                        else
                            b = 0

        cv = Av[7] + Dv[6]
        if cv > 3
            c = 0
        else
            cv += Cv[10]
            if cv > 3
                c = 0
            else
                if c
                    if cv < 1
                        c = 0
                    else
                        cv += Bv[2]
                        if cv < 2 or cv > 3
                            c = 0
                        else
                            c = 1
                else
                    if cv < 2
                        c = 0
                    else
                        cv += Bv[2]
                        if cv == 3
                            c = 1
                        else
                            c = 0

        dv = Bv[7] + Cv[5]
        if dv > 3
            d = 0
        else
            dv += Dv[11]
            if dv > 3
                d = 0
            else
                if d
                    if dv < 1
                        d = 0
                    else
                        dv += Av[3]
                        if dv < 2 or dv > 3
                            d = 0
                        else
                            d = 1
                else
                    if dv < 2
                        d = 0
                    else
                        dv += Av[3]
                        if dv == 3
                            d = 1
                        else
                            d = 0

        # ... whew

        supercell = @getOrCreateSupercell(a, b, c, d)
        supercellResult =
            value: supercell
            updates: (current != supercell)

        @supercellResultCache[name] = supercellResult
        return supercellResult


    preCache: ->
        cellOpts = [0, 1]
        for a in cellOpts
            for b in cellOpts
                for c in cellOpts
                    for d in cellOpts
                        @getOrCreateSupercell(a, b, c, d)

        supercells = @supercellCache
        for A of supercells
            for B of supercells
                for C of supercells
                    for D of supercells
                        @getSupercellResult(supercells[A], supercells[B], supercells[C], supercells[D])

    superI: (x, y) -> (y * @w2) + x # +1

    supercellAt: (x, y) ->
        if x >= @w2 or x < 0 or y >= @h2 or y < 0 then return null # +[1-2]
        return @superI(x, y) # +1(+1)

    updateSupercellBuffer: (x, y, supercell) ->
        if x >= @w2 or x < 0 or y >= @h2 or y < 0 then return #+[1-2]
        i = @superI(x, y) # +1(+1)
        if supercell.updates # +1
            res = 1
        else
            res = 0
        @supercellBuffer[i] = supercell.value # +3
        return res

    clearState: ->
        @ticked = true
        @rendered = false

    # for the current cell, sets the x/y properties of @ given the index passed
    setTickPointer : (i) ->
        x = i % @w2 # +1
        y = (i - x) / @w2 # +1
        @x = x # +1
        @y = y # +1
        return null

    tick: ->
        @ticked = true # +1
        @swapPointer() # +18
        supercells = @supercells # +1

        empty = @empty # +1
        i = @_i # +1
        w2 = @w2 # +1

        currentCells = @supercellCurrentCells # +1
        supercells = @supercells # +1
        buffercells = @supercellBuffer
        nextCells = @supercellBufferCells # +1
        bufferUpdates = @supercellBufferUpdates # +1
        # pre loop property accesses = 26
        #

        # was
        # non updating +[29-43] each
        # updating +[54-88] each
        #
        # now
        # non updating +[14-19] each
        # updating +[25-36] each
        #
        # [29-88] => [13-36]
        # saved [16-52] property lookups *per array item!

        counter = 0

        for cI in currentCells

            # +[5-9] # +[9-13] to get the 4 cells needed to updated
            pointer = supercells[cI] # +1
            A = pointer.A # +1 #supercells[pointer.a] # 2
            B = pointer.B # +1 #supercells[pointer.b] # 2
            C = pointer.C # +1 #supercells[pointer.c] # 2
            D = pointer.D # +1 #supercells[pointer.d] # 2
            if A? then A = A.supercell else A = empty # +[0-1]
            if B? then B = B.supercell else B = empty # +[0-1]
            if C? then C = C.supercell else C = empty # +[0-1]
            if D? then D = D.supercell else D = empty # +[0-1]

            # +7 to get cached result
            calc = @getSupercellResult(A, B, C, D) # +7

            Di = pointer.Di # +1
            pd = pointer.di # +1
            if Di?
                # Di = buffercells[pd] # +1
                Di.supercell = calc.value # +2

            # if updates +[11-17]
            if calc.updates # +1
                counter++
                # + [8-20]
                pa = pointer.ai # +1
                pb = pointer.bi # +1
                pc = pointer.ci # +1

                if pa? and bufferUpdates[pa] == 0 # +1
                    # Ai = buffercells[pa] # +1
                    bufferUpdates[pa] = 1 # +1
                    nextCells.push(pa) # +1
                if pb? and bufferUpdates[pb] == 0 # +1
                    # Bi = buffercells[pb] # +1
                    bufferUpdates[pb] = 1 # +1
                    nextCells.push(pb) # +1
                if pc? and bufferUpdates[pc] == 0 # +1
                    # Ci = buffercells[pc] # +1
                    bufferUpdates[pc] = 1 # +1
                    nextCells.push(pc) # +1
                if pd? and bufferUpdates[pd] == 0 # +1
                    # Di = buffercells[pd] # +1
                    bufferUpdates[pd] = 1 # +1
                    nextCells.push(pd) # +1

        # console.log "#{counter} updates"
        # console.log nextCells.length
        @supercellBufferCells = nextCells
        @supercellBufferUpdates = bufferUpdates
        return

    clearBoard : ->
        empty = @empty
        for cell in @supercells
            cell.supercell = empty
        for cell in @supercellBuffer
            cell.supercell = empty

    prepareRender : ->
        return unless @ticked

        @rendered = false
        @ticked = false

        i = @_i

        h2 = @h2
        w = @w
        w2 = @w2
        w4 = w * 4
        pixeldata = @imageDataObject.data

        r = Math.round(Math.random() * 3)

        for y in [0...h2]
            y2 = ((y*2)+i) * w
            for x in [0...w2]
                p0 = ((y2 + ((x*2)+i)) * 4) + 3
                p1 = p0 + w4
                p2 = p0 + 4
                p3 = p1 + 4

                sc = @supercells[@supercellAt(x, y)].supercell
                scv = sc.values

                if r is 1
                    pixeldata[p0-3] += 2 * scv[0]
                    pixeldata[p1-3] += 2 * scv[1]
                    pixeldata[p2-3] += 2 * scv[2]
                    pixeldata[p3-3] += 2 * scv[3]
                if r is 2
                    pixeldata[p0-2] += 2 * scv[0]
                    pixeldata[p1-2] += 2 * scv[1]
                    pixeldata[p2-2] += 2 * scv[2]
                    pixeldata[p3-2] += 2 * scv[3]
                if r is 0
                    pixeldata[p0-1] += 2 * scv[0]
                    pixeldata[p1-1] += 2 * scv[1]
                    pixeldata[p2-1] += 2 * scv[2]
                    pixeldata[p3-1] += 2 * scv[3]

                pixeldata[p0] = 255 - (63 * scv[0])
                pixeldata[p1] = 255 - (63 * scv[1])
                pixeldata[p2] = 255 - (63 * scv[2])
                pixeldata[p3] = 255 - (63 * scv[3])

        return

    render : ->
        unless @rendered
            @ctx.putImageData(@imageDataObject, 0, 0)
            @rendered = true

    perf: (fnc) ->
        start = new Date().getTime()
        @[fnc]()
        stop = new Date().getTime()
        delta = stop - start
        console.log "#{fnc} took #{delta}ms"

    start: (delay=20)->
        @tick()
        @prepareRender()

        tick = =>
            @tick()

        prepareRender = =>
            @prepareRender()

        render = =>
            requestAnimationFrame(render)
            @render()
            setTimeout(prepareRender, 1)

        @interval = setInterval(tick, delay)
        render()

    next: ->
        @tick()
        @prepareRender()
        @render()


    renderSwap : ->
        @clearState()
        @swapPointer()
        @prepareRender()
        @render()

    getNames : -> @[@_i].map( (x) -> x.name )

this.grid = new Game(500, 500)
###
this.grid = new Game(8, 8, [

    0, 0, 0, 0, 0, 0, 0, 0
    0, 0, 0, 0, 0, 0, 0, 0
    0, 0, 0, 0, 0, 0, 0, 0
    0, 0, 0, 0, 0, 0, 0, 0
    0, 0, 0, 1, 0, 1, 1, 0
    0, 0, 0, 0, 1, 0, 0, 1
    0, 0, 0, 0, 0, 1, 1, 0
    0, 0, 0, 0, 0, 0, 0, 0
])
###

this.grid.preCache()
this.grid.cacheSupercellGridNeighbors()
# this.grid.ticked = true
# this.grid.prepareRender()
# this.grid.render()
this.grid.start()