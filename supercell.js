// Generated by CoffeeScript 1.4.0

/*

coffeescript game-of-life implementation with caching and other neat things
*/


(function() {
  var Game;

  Game = (function() {

    function Game(w, h, cells) {
      this.w = w;
      this.h = h;
      if (cells != null) {
        this.cells = cells;
      } else {
        this.cells = [];
        this.makeCells();
      }
      this.supercellCache = {};
      this.supercellResultCache = {};
      this.supercellGrids = [];
      this._i = 0;
      this.w2 = this.w / 2;
      this.h2 = this.h / 2;
      this.getSupercellGrid(0, 0);
      this.getSupercellGrid(1, 1);
      this.cells = void 0;
      this.supercellBufferCells = this.supercellGrids[0].activeCells;
      this.supercellBufferUpdates = this.supercellGrids[0].activeFlags;
      this.empty = this.getOrCreateSupercell(0, 0, 0, 0);
      this.supercells = this.supercellGrids[0].supercells;
      this.canvas = document.getElementById('thecanvas');
      this.canvas.height = this.h;
      this.canvas.width = this.w;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = '#000';
      this.canvas.style.backgroundColor = '#FFF';
      this.ctx.fillRect(0, 0, this.w, this.h);
      this.imageDataObject = this.ctx.getImageData(0, 0, this.w, this.h);
      this.rendered = false;
    }

    Game.prototype.makeCells = function() {
      var cells, x, y, _i, _j, _ref, _ref1;
      cells = [];
      for (y = _i = 0, _ref = this.h; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        for (x = _j = 0, _ref1 = this.w; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
          if (y < 2 || x < 2) {
            cells.push(0);
          } else {
            cells.push(Math.round(Math.random() * 0.54));
          }
        }
      }
      return this.cells = cells;
    };

    Game.prototype.i = function(x, y) {
      return (y * this.w) + x;
    };

    Game.prototype.swapPointer = function() {
      var active, buffer, i, newUpdates;
      i = this._i;
      buffer = this.supercellGrids[i];
      this.supercellBuffer = buffer.supercells;
      i = 1 - i;
      active = this.supercellGrids[i];
      this.supercells = active.supercells;
      this.supercellCurrentCells = this.supercellBufferCells;
      this.supercellBufferCells = [];
      this.supercellCurrentUpdates = this.supercellBufferUpdates;
      newUpdates = new ArrayBuffer(this.w2 * this.h2);
      this.supercellBufferUpdates = new Uint8Array(newUpdates);
      return this._i = i;
    };

    Game.prototype.at = function(x, y) {
      if (x >= this.w || x < 0 || y >= this.h || y < 0) {
        return 0;
      }
      return cells[this.i(x, y)];
    };

    Game.prototype.atIndex = function(i) {
      var cell;
      cell = this.cells[i];
      if (cell != null) {
        return cell;
      } else {
        return 0;
      }
    };

    Game.prototype.getSupercellName = function(a, b, c, d) {
      return '' + a + b + c + d;
    };

    Game.prototype.createSupercell = function(name, a, b, c, d) {
      var sc;
      return sc = {
        name: name,
        values: [a, b, c, d, a + b, b + d, c + a, d + c, a + b + c, b + d + a, c + a + d, d + c + b]
      };
    };

    Game.prototype.getOrCreateSupercell = function(a, b, c, d) {
      var cached, create, name;
      name = this.getSupercellName(a, b, c, d);
      cached = this.supercellCache[name];
      if (cached != null) {
        return cached;
      }
      create = this.createSupercell(name, a, b, c, d);
      this.supercellCache[name] = create;
      return create;
    };

    Game.prototype.getSupercellGrid = function(iO) {
      var a, aa, activeCells, activeFlags, ai, b, bb, bi, c, ci, d, di, h2, i, iA, iB, iC, iD, supercells, theCell, theCellPointer, vA, vB, vC, vD, w2, x, x2, x3, xi, y, y2, y3, yi, _i, _j;
      if (iO == null) {
        iO = 0;
      }
      supercells = [];
      activeFlags = [];
      activeCells = [];
      h2 = this.h2;
      w2 = this.w2;
      for (y = _i = 0; 0 <= h2 ? _i < h2 : _i > h2; y = 0 <= h2 ? ++_i : --_i) {
        y2 = (y * 2) + iO;
        y3 = y2 + 1;
        for (x = _j = 0; 0 <= w2 ? _j < w2 : _j > w2; x = 0 <= w2 ? ++_j : --_j) {
          x2 = (x * 2) + iO;
          x3 = x2 + 1;
          i = (y * w2) + x;
          iA = this.i(x2, y2);
          iB = this.i(x2, y3);
          iC = this.i(x3, y2);
          iD = this.i(x3, y3);
          vA = this.atIndex(iA);
          vB = this.atIndex(iB);
          vC = this.atIndex(iC);
          vD = this.atIndex(iD);
          a = i;
          b = y + 1 < h2 ? i + w2 : null;
          c = x + 1 < w2 ? i + 1 : null;
          d = x + 1 < w2 && (b != null) ? b + 1 : null;
          xi = x - (1 - iO);
          yi = y - (1 - iO);
          aa = (yi * w2) + xi;
          bb = aa + w2;
          ai = xi > -1 && yi > -1 ? aa : null;
          bi = xi > -1 && yi + 1 < h2 ? bb : null;
          ci = xi + 1 < w2 && yi > -1 ? aa + 1 : null;
          di = xi + 1 < w2 && yi + 1 < h2 ? bb + 1 : null;
          theCell = this.getOrCreateSupercell(vA, vB, vC, vD);
          theCellPointer = {
            supercell: theCell,
            a: a,
            b: b,
            c: c,
            d: d,
            ai: ai,
            bi: bi,
            ci: ci,
            di: di
          };
          if (false === true) {
            console.log(theCellPointer);
            console.log(i, x, y, a, b, c, d);
            console.log(aa, bb);
            console.log(iO, xi, yi, ai, bi, ci, di);
          }
          supercells.push(theCellPointer);
          activeFlags.push(1);
          activeCells.push(i);
        }
      }
      this.supercellGrids.push({
        supercells: supercells,
        activeFlags: activeFlags,
        activeCells: activeCells
      });
      return void 0;
    };

    Game.prototype.cacheSupercellGridNeighbors = function() {
      var b, buffer, bufferCells, cell, cells, grid, grids, i, _i, _j, _len, _len1;
      grids = this.supercellGrids;
      for (i = _i = 0, _len = grids.length; _i < _len; i = ++_i) {
        grid = grids[i];
        b = 1 - i;
        buffer = grids[b];
        cells = grid.supercells;
        bufferCells = buffer.supercells;
        for (_j = 0, _len1 = cells.length; _j < _len1; _j++) {
          cell = cells[_j];
          cell.A = cell.a != null ? cells[cell.a] : null;
          cell.B = cell.b != null ? cells[cell.b] : null;
          cell.C = cell.c != null ? cells[cell.c] : null;
          cell.D = cell.d != null ? cells[cell.d] : null;
          cell.Ai = cell.ai != null ? bufferCells[cell.ai] : null;
          cell.Bi = cell.bi != null ? bufferCells[cell.bi] : null;
          cell.Ci = cell.ci != null ? bufferCells[cell.ci] : null;
          cell.Di = cell.di != null ? bufferCells[cell.di] : null;
        }
      }
    };

    Game.prototype.getCellResultFromNeighbors = function(cell, neighbors) {
      var n, score, _i, _len;
      score = 0;
      for (_i = 0, _len = neighbors.length; _i < _len; _i++) {
        n = neighbors[_i];
        score += n;
      }
      if (cell) {
        if (score < 2 || score > 3) {
          return 0;
        }
        return 1;
      } else {
        if (score === 3) {
          return 1;
        }
        return 0;
      }
    };

    Game.prototype.getSupercellResult = function(A, B, C, D) {
      var Av, Bv, Cv, Dv, a, av, b, bv, c, cache, current, cv, d, dv, name, supercell, supercellResult;
      name = A.name + B.name + C.name + D.name;
      cache = this.supercellResultCache[name];
      if (cache != null) {
        return cache;
      }
      Av = A.values;
      Bv = B.values;
      Cv = C.values;
      Dv = D.values;
      av = 0;
      bv = 0;
      cv = 0;
      dv = 0;
      a = Av[3];
      b = Bv[2];
      c = Cv[1];
      d = Dv[0];
      current = this.getOrCreateSupercell(a, b, c, d);
      av = Bv[6] + Cv[4];
      if (av > 3) {
        a = 0;
      } else {
        av += Av[8];
        if (av > 3) {
          a = 0;
        } else {
          if (a) {
            if (av < 1) {
              a = 0;
            } else {
              av += Dv[0];
              if (av < 2 || av > 3) {
                a = 0;
              } else {
                a = 1;
              }
            }
          } else {
            if (av < 2) {
              a = 0;
            } else {
              av += Dv[0];
              if (av === 3) {
                a = 1;
              } else {
                a = 0;
              }
            }
          }
        }
      }
      bv = Av[5] + Dv[4];
      if (bv > 3) {
        b = 0;
      } else {
        bv += Bv[9];
        if (bv > 3) {
          b = 0;
        } else {
          if (b) {
            if (bv < 1) {
              b = 0;
            } else {
              bv += Cv[1];
              if (bv < 2 || bv > 3) {
                b = 0;
              } else {
                b = 1;
              }
            }
          } else {
            if (bv < 2) {
              b = 0;
            } else {
              bv += Cv[1];
              if (bv === 3) {
                b = 1;
              } else {
                b = 0;
              }
            }
          }
        }
      }
      cv = Av[7] + Dv[6];
      if (cv > 3) {
        c = 0;
      } else {
        cv += Cv[10];
        if (cv > 3) {
          c = 0;
        } else {
          if (c) {
            if (cv < 1) {
              c = 0;
            } else {
              cv += Bv[2];
              if (cv < 2 || cv > 3) {
                c = 0;
              } else {
                c = 1;
              }
            }
          } else {
            if (cv < 2) {
              c = 0;
            } else {
              cv += Bv[2];
              if (cv === 3) {
                c = 1;
              } else {
                c = 0;
              }
            }
          }
        }
      }
      dv = Bv[7] + Cv[5];
      if (dv > 3) {
        d = 0;
      } else {
        dv += Dv[11];
        if (dv > 3) {
          d = 0;
        } else {
          if (d) {
            if (dv < 1) {
              d = 0;
            } else {
              dv += Av[3];
              if (dv < 2 || dv > 3) {
                d = 0;
              } else {
                d = 1;
              }
            }
          } else {
            if (dv < 2) {
              d = 0;
            } else {
              dv += Av[3];
              if (dv === 3) {
                d = 1;
              } else {
                d = 0;
              }
            }
          }
        }
      }
      supercell = this.getOrCreateSupercell(a, b, c, d);
      supercellResult = {
        value: supercell,
        updates: current !== supercell
      };
      this.supercellResultCache[name] = supercellResult;
      return supercellResult;
    };

    Game.prototype.preCache = function() {
      var A, B, C, D, a, b, c, cellOpts, d, supercells, _i, _j, _k, _l, _len, _len1, _len2, _len3, _results;
      cellOpts = [0, 1];
      for (_i = 0, _len = cellOpts.length; _i < _len; _i++) {
        a = cellOpts[_i];
        for (_j = 0, _len1 = cellOpts.length; _j < _len1; _j++) {
          b = cellOpts[_j];
          for (_k = 0, _len2 = cellOpts.length; _k < _len2; _k++) {
            c = cellOpts[_k];
            for (_l = 0, _len3 = cellOpts.length; _l < _len3; _l++) {
              d = cellOpts[_l];
              this.getOrCreateSupercell(a, b, c, d);
            }
          }
        }
      }
      supercells = this.supercellCache;
      _results = [];
      for (A in supercells) {
        _results.push((function() {
          var _results1;
          _results1 = [];
          for (B in supercells) {
            _results1.push((function() {
              var _results2;
              _results2 = [];
              for (C in supercells) {
                _results2.push((function() {
                  var _results3;
                  _results3 = [];
                  for (D in supercells) {
                    _results3.push(this.getSupercellResult(supercells[A], supercells[B], supercells[C], supercells[D]));
                  }
                  return _results3;
                }).call(this));
              }
              return _results2;
            }).call(this));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    Game.prototype.superI = function(x, y) {
      return (y * this.w2) + x;
    };

    Game.prototype.supercellAt = function(x, y) {
      if (x >= this.w2 || x < 0 || y >= this.h2 || y < 0) {
        return null;
      }
      return this.superI(x, y);
    };

    Game.prototype.updateSupercellBuffer = function(x, y, supercell) {
      var i, res;
      if (x >= this.w2 || x < 0 || y >= this.h2 || y < 0) {
        return;
      }
      i = this.superI(x, y);
      if (supercell.updates) {
        res = 1;
      } else {
        res = 0;
      }
      this.supercellBuffer[i] = supercell.value;
      return res;
    };

    Game.prototype.clearState = function() {
      this.ticked = true;
      return this.rendered = false;
    };

    Game.prototype.setTickPointer = function(i) {
      var x, y;
      x = i % this.w2;
      y = (i - x) / this.w2;
      this.x = x;
      this.y = y;
      return null;
    };

    Game.prototype.tick = function() {
      var A, B, C, D, Di, bufferUpdates, buffercells, cI, calc, counter, currentCells, empty, i, nextCells, pa, pb, pc, pd, pointer, supercells, w2, _i, _len;
      this.ticked = true;
      this.swapPointer();
      supercells = this.supercells;
      empty = this.empty;
      i = this._i;
      w2 = this.w2;
      currentCells = this.supercellCurrentCells;
      supercells = this.supercells;
      buffercells = this.supercellBuffer;
      nextCells = this.supercellBufferCells;
      bufferUpdates = this.supercellBufferUpdates;
      counter = 0;
      for (_i = 0, _len = currentCells.length; _i < _len; _i++) {
        cI = currentCells[_i];
        pointer = supercells[cI];
        A = pointer.A;
        B = pointer.B;
        C = pointer.C;
        D = pointer.D;
        if (A != null) {
          A = A.supercell;
        } else {
          A = empty;
        }
        if (B != null) {
          B = B.supercell;
        } else {
          B = empty;
        }
        if (C != null) {
          C = C.supercell;
        } else {
          C = empty;
        }
        if (D != null) {
          D = D.supercell;
        } else {
          D = empty;
        }
        calc = this.getSupercellResult(A, B, C, D);
        Di = pointer.Di;
        pd = pointer.di;
        if (Di != null) {
          Di.supercell = calc.value;
        }
        if (calc.updates) {
          counter++;
          pa = pointer.ai;
          pb = pointer.bi;
          pc = pointer.ci;
          if ((pa != null) && bufferUpdates[pa] === 0) {
            bufferUpdates[pa] = 1;
            nextCells.push(pa);
          }
          if ((pb != null) && bufferUpdates[pb] === 0) {
            bufferUpdates[pb] = 1;
            nextCells.push(pb);
          }
          if ((pc != null) && bufferUpdates[pc] === 0) {
            bufferUpdates[pc] = 1;
            nextCells.push(pc);
          }
          if ((pd != null) && bufferUpdates[pd] === 0) {
            bufferUpdates[pd] = 1;
            nextCells.push(pd);
          }
        }
      }
      this.supercellBufferCells = nextCells;
      this.supercellBufferUpdates = bufferUpdates;
    };

    Game.prototype.clearBoard = function() {
      var cell, empty, _i, _j, _len, _len1, _ref, _ref1, _results;
      empty = this.empty;
      _ref = this.supercells;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        cell.supercell = empty;
      }
      _ref1 = this.supercellBuffer;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        cell = _ref1[_j];
        _results.push(cell.supercell = empty);
      }
      return _results;
    };

    Game.prototype.prepareRender = function() {
      var h2, i, p0, p1, p2, p3, pixeldata, r, sc, scv, w, w2, w4, x, y, y2, _i, _j;
      if (!this.ticked) {
        return;
      }
      this.rendered = false;
      this.ticked = false;
      i = this._i;
      h2 = this.h2;
      w = this.w;
      w2 = this.w2;
      w4 = w * 4;
      pixeldata = this.imageDataObject.data;
      r = Math.round(Math.random() * 3);
      for (y = _i = 0; 0 <= h2 ? _i < h2 : _i > h2; y = 0 <= h2 ? ++_i : --_i) {
        y2 = ((y * 2) + i) * w;
        for (x = _j = 0; 0 <= w2 ? _j < w2 : _j > w2; x = 0 <= w2 ? ++_j : --_j) {
          p0 = ((y2 + ((x * 2) + i)) * 4) + 3;
          p1 = p0 + w4;
          p2 = p0 + 4;
          p3 = p1 + 4;
          sc = this.supercells[this.supercellAt(x, y)].supercell;
          scv = sc.values;
          if (r === 1) {
            pixeldata[p0 - 3] += 2 * scv[0];
            pixeldata[p1 - 3] += 2 * scv[1];
            pixeldata[p2 - 3] += 2 * scv[2];
            pixeldata[p3 - 3] += 2 * scv[3];
          }
          if (r === 2) {
            pixeldata[p0 - 2] += 2 * scv[0];
            pixeldata[p1 - 2] += 2 * scv[1];
            pixeldata[p2 - 2] += 2 * scv[2];
            pixeldata[p3 - 2] += 2 * scv[3];
          }
          if (r === 0) {
            pixeldata[p0 - 1] += 2 * scv[0];
            pixeldata[p1 - 1] += 2 * scv[1];
            pixeldata[p2 - 1] += 2 * scv[2];
            pixeldata[p3 - 1] += 2 * scv[3];
          }
          pixeldata[p0] = 255 - (63 * scv[0]);
          pixeldata[p1] = 255 - (63 * scv[1]);
          pixeldata[p2] = 255 - (63 * scv[2]);
          pixeldata[p3] = 255 - (63 * scv[3]);
        }
      }
    };

    Game.prototype.render = function() {
      if (!this.rendered) {
        this.ctx.putImageData(this.imageDataObject, 0, 0);
        return this.rendered = true;
      }
    };

    Game.prototype.perf = function(fnc) {
      var delta, start, stop;
      start = new Date().getTime();
      this[fnc]();
      stop = new Date().getTime();
      delta = stop - start;
      return console.log("" + fnc + " took " + delta + "ms");
    };

    Game.prototype.start = function(delay) {
      var prepareRender, render, tick,
        _this = this;
      if (delay == null) {
        delay = 20;
      }
      this.tick();
      this.prepareRender();
      tick = function() {
        return _this.tick();
      };
      prepareRender = function() {
        return _this.prepareRender();
      };
      render = function() {
        requestAnimationFrame(render);
        _this.render();
        return setTimeout(prepareRender, 1);
      };
      this.interval = setInterval(tick, delay);
      return render();
    };

    Game.prototype.next = function() {
      this.tick();
      this.prepareRender();
      return this.render();
    };

    Game.prototype.renderSwap = function() {
      this.clearState();
      this.swapPointer();
      this.prepareRender();
      return this.render();
    };

    Game.prototype.getNames = function() {
      return this[this._i].map(function(x) {
        return x.name;
      });
    };

    return Game;

  })();

  this.grid = new Game(500, 500);

  /*
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
  */


  this.grid.preCache();

  this.grid.cacheSupercellGridNeighbors();

  this.grid.start();

}).call(this);
