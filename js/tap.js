	const params = {
		count: 150,
		firstHitOnly: true,
		useBVH: true,
		click: false,
		displayHelper: false,
		helperDepth: 10,
	};
	const displayInfo = {
		startTime: new Date(),
		oldTime: 0,
		lastCount:0,
		updateDisplay: true
	}
	let camera, controls, scene, renderer, cubes, savedCubes=[];
	let dimensions, raycaster, animinateID, pointer={};
	let type,difficulty;

	document.getElementById('startButton').addEventListener('click',page1ClickHandler);
	window.addEventListener( 'resize', onWindowResize );
	setupButtons();
	class Cube  {
		constructor( direction,_materials,position,index ) {
			let mesh;
			let materials=Object.assign([],_materials);
			materials.sort(() => Math.random() - 0.5);
			this.direction=direction;
			this.materials=materials;
			this.position=position;
			const group = new Group();
			group.position.x=position[0];
			group.position.y=position[1];
			group.position.z=position[2];
			group.cubeIndex=index;
			const material = new MeshBasicMaterial( { color: 0xffffff, side: DoubleSide  } );
			const geometry = new BoxGeometry( 1,1,1);
			const edges = new EdgesGeometry(geometry);
			const lines = new LineSegments(edges,
				new LineBasicMaterial(
					{color:0xffffff,linewidth:0.04,linecap:'round',linejoin:'round'})
			);
			geometry.cubeIndex=index;
			geometry.pjo={group:group,direction:direction,position:position,x:index.x,y:index.y,z:index.z};
			//const color = new Color( 0xffffff );
			mesh = new Mesh( geometry, materials );
			mesh.cubeIndex=index;
			geometry.computeBoundsTree();
			group.add(mesh);
			group.add(lines);

			const vertices = {};
			let vertices_front = new Float32Array([-0.2,-0.2,0.501, 0.2,0,0.501, -0.2,0.2,0.501]);
			let vertices_back = new Float32Array([+0.2,+0.2,-0.501, -0.2,0,-0.501, +0.2,-0.2,-0.501]);
			let vertices_left = new Float32Array([-0.501,-0.2,-0.2, -0.501,0,0.2, -0.501,0.2,-0.2]);
			let vertices_right = new Float32Array([0.501,-0.2,-0.2, 0.501,0,0.2, 0.501,0.2,-0.2]);
			let vertices_top = new Float32Array([-0.2,0.501,-0.2, 0,0.501,0.2, 0.2,0.501,-0.2]);
			let vertices_bottom = new Float32Array([-0.2,-0.501,-0.2, 0,-0.501,0.2, 0.2,-0.501,-0.2]);

			const faceOptions={
				ff:{v:vertices_front,   arrow:['n','n',180,0,+90,-90],axis:'Z'},
				baf:{v:vertices_back,   arrow:['n','n',0,180,-90,+90],axis:'Z'},
				lf:{v:vertices_left,    arrow:[0,180,'n','n',-90,+90],axis:'X'},
				rf:{v:vertices_right,   arrow:[0,180,'n','n',-90,+90],axis:'X'},
				tf:{v:vertices_top,     arrow:[0,180,-90,+90,'n','n'],axis:'Y'},
				bof:{v:vertices_bottom, arrow:[0,180,-90,+90,'n','n'],axis:'Y'},
			}
			for (let x in faceOptions) {
				let f = faceOptions[x];
				let r = f.arrow[direction];
				if (r=='n') continue;
				let geometryf = new BufferGeometry();
				geometryf.setAttribute( 'position',
					new BufferAttribute(f.v, 3 ) );
				geometryf['rotate'+f.axis](f.arrow[direction]*3.14159/180);
				mesh = new Mesh( geometryf, material );
				group.add( mesh );
			}
			this.group=group;
			return;
		}

	}	// end Cube object
	function setupButtons() {
		var selectTypes = document.getElementsByName("selectType");
		for (let i=0;i<selectTypes.length;i++) {
			selectTypes[i].addEventListener('click',function(e) {
				for (let i=0;i<selectTypes.length;i++) {
					selectTypes[i].parentElement.classList.remove("qSelect");
				}
				e.target.parentElement.classList.add("qSelect");
			});
		}
		var selectDifficultys = document.getElementsByName("selectDifficulty");
		for (let i=0;i<selectDifficultys.length;i++) {
			selectDifficultys[i].addEventListener('click',function(e) {
				for (let i=0;i<selectTypes.length;i++) {
					selectDifficultys[i].parentElement.classList.remove("qSelect");
				}
				e.target.parentElement.classList.add("qSelect");
			});
		}
		document.getElementById('close').addEventListener('click',function() {
			document.getElementById('page1').style.display='block';
			document.getElementById('page2').style.display='none';
		})
		document.getElementById('help').addEventListener("click",function() {
			document.getElementById('page2').style.display='block';
			document.getElementById('page1').style.display='none';
		})
	}
	function init(dimensions) {
		params.firstTime=true;
		displayInfo.updateDisplay=true;
		displayInfo.startTime = new Date();
		setup3DEnvironment();
		const materials = [
			new MeshBasicMaterial( {color: 0x203764} ),
			new MeshBasicMaterial( {color: 0x00b050} ),
			new MeshBasicMaterial( {color: 0xffc000} ),
			new MeshBasicMaterial( {color: 0xff0066} ),
			new MeshBasicMaterial( {color: 0x9966ff} ),
			new MeshBasicMaterial( {color: 0x00b0f0} )
		];
		var position=[];
		for ( let i = 0; i < dimensions.x; i ++ ) {
			position[0]=i;
			for ( let j = 0; j < dimensions.y; j++){
				position[1]=j;
				for ( let k = 0; k < dimensions.z; k++) {
					if (cubes[i][j][k].show==false) continue
					let direction=cubes[i][j][k].direction;
					position[2] = k;
					var cube=new Cube(direction,materials.reverse(),position,{x:i,y:j,z:k});
					cube.cubeIndex={x:i,y:j,z:k};
					cube.group.isMoving=false;
					//cubes[i][j][k] = Object.assign({x:i,y:j,z:k}, cube);
					savedCubes.push(cube);
					scene.add(cube.group);
				}
			}
		}

		const dirLight1 = new DirectionalLight( 0xffffff );
		dirLight1.position.set( 1, 1, 1 );
		scene.add( dirLight1 );

		const dirLight2 = new DirectionalLight( 0x002288 );
		dirLight2.position.set( - 1, - 1, - 1 );
		scene.add( dirLight2 );

		const ambientLight = new AmbientLight( 0x222222 );
		scene.add( ambientLight );
	}
	function setup3DEnvironment() {
		var canvasPage = document.getElementById('canvasPage');
		BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
		BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
		Mesh.prototype.raycast = acceleratedRaycast;
		scene = new Scene();
		scene.background = new Color( 0x222255 );
		//scene.fog = new FogExp2( 0xcccccc, 0.002 );
		scene.position.x=-dimensions.x/2+0.5;
		scene.position.y=-dimensions.y/2+0.5;
		scene.position.z=-dimensions.z/2+0.5;
		renderer = new WebGLRenderer( { antialias: true } );
		renderer.domElement.id="renderCanvas";
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.domElement.addEventListener( 'click', onPointerDown );

		canvasPage.appendChild( renderer.domElement );

		camera = new PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
//				camera.position.set( - 40, 0, 60 );
		camera.position.set(
			- dimensions.x-5-difficulty,
			dimensions.y+5+difficulty*2,
			dimensions.z+5+difficulty*2 );

		controls = new OrbitControls( camera, renderer.domElement );
		controls.enableZoom=true;
		controls.screenSpacePanning = true;
		controls.listenToKeyEvents( window ); // optional
		controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		controls.dampingFactor = 0.05;
		controls.endableZoom = true;
		controls.minDistance = 10;
		controls.maxDistance = 500;
		controls.saveState();
		raycaster = new Raycaster();
		pointer = new Vector2();
	}
	function page1ClickHandler(e) {
		e.preventDefault();
		var pages = document.getElementsByClassName("page");
		for (var i = 0; i < pages.length; i++) {
		   pages[i].style.display='none';
		}
		document.getElementById('canvasPage').style.display='block';
		document.getElementById('congrat').style.display='none';
		type=document.querySelector("input[name=selectType]:checked").value;
		type=parseInt(type);
		difficulty = document.querySelector("input[name=selectDifficulty]:checked").value;
		difficulty = parseInt(difficulty);
		switch(type) {
			case 1:
				switch(difficulty) {
					case 1:
						dimensions={x:4,y:4,z:4};
						cubes = createTestCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;

					case 2:
						dimensions={x:6,y:6,z:6};
						cubes = createTestCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
					case 3:
						dimensions={x:8,y:8,z:8};
						cubes = createTestCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
					case 4:
						dimensions={x:10,y:10,z:10};
						cubes = createTestCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
			}
			break;
			case 2:
				switch(difficulty) {
					case 1:
						dimensions={x:10,y:10,z:2};
						cubes = createTestCircleCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;

					case 2:
						dimensions={x:12,y:12,z:3};
						cubes = createTestCircleCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
					case 3:
						dimensions={x:15,y:15,z:4};
						cubes = createTestCircleCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
					case 4:
						dimensions={x:20,y:20,z:4};
						cubes = createTestCircleCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
			}
			break;
			case 3:
				switch(difficulty) {
					case 1:
						dimensions={x:10,y:10,z:2};
						cubes = createTestFrameCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;

					case 2:
						dimensions={x:12,y:12,z:3};
						cubes = createTestFrameCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
					case 3:
						dimensions={x:15,y:15,z:4};
						cubes = createTestFrameCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
					case 4:
						dimensions={x:20,y:20,z:4};
						cubes = createTestFrameCubes(dimensions.x,dimensions.y,dimensions.z);
						init(dimensions);
						break;
			}
			break;
		}
		animate();
	}
	function onPointerDown( event ) {
		pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		params.click = true;
	}
	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	function animate() {
		animinateID=requestAnimationFrame( animate );
		render();
	}
	function render() {
		// update the picking ray with the camera and pointer position
		raycaster.setFromCamera( pointer, camera );
		// calculate objects intersecting the picking ray
		if (params.click) {
			params.click=false;
			const intersects = raycaster.intersectObjects( scene.children );
			for ( let i = 0; i < intersects.length; i ++ ) {
				let geo = intersects[ i ].object.geometry;
				if (geo.type!="BoxGeometry") continue;
				moveObject(geo); // selected cube
				break;
			}
		}
		updateDisplay();
		renderer.render( scene, camera );
		renderer.clearDepth(); // important!


	}
	function PingPongCube(cube,interceptCube) {
		var deltaX,deltaY,deltaZ;
		deltaX=(cube.cubeIndex.x-interceptCube.cubeIndex.x);
		deltaY=(cube.cubeIndex.y-interceptCube.cubeIndex.y);
		deltaZ=(cube.cubeIndex.z-interceptCube.cubeIndex.z);
		if (Math.abs(deltaX)==1) return;
		if (Math.abs(deltaY)==1) return;
		if (Math.abs(deltaZ)==1) return;
		if (deltaX>0) deltaX-=1;
		if (deltaX<0) deltaX+=1;
		if (deltaY>0) deltaY-=1;
		if (deltaY<0) deltaY+=1;
		if (deltaZ>0) deltaZ-=1;
		if (deltaZ<0) deltaZ+=1;
		var rtnFunction = function(cube) {
			moveCube(cube,deltaX,deltaY,deltaZ,1000,function(){});
		}
		moveCube(cube,-deltaX,-deltaY,-deltaZ,1000,rtnFunction);
	}
	function moveObject(boxMesh) {
		var timeFraction=0,progress,start,end,startTime,duration,cubeObject,newX,newY,newZ;
		var x,y,z;
		var data = boxMesh.pjo;
		var direction = data.direction;
		x=y=z=0;
		switch (direction) {
			case 2:
				x=-20;
				break;
			case 3:
				x=20;
				break;
			case 5:
				y=-20;
				break;
			case 4:
				y=20;
				break;
			case 1:
				z=-20;
				break;
			case 0:
				z=20;
				break;
		}
		cubeObject = boxMesh.pjo.group;
		var intercept = cubeCanMove(boxMesh,x,y,z)
		if (intercept!=true) {
			PingPongCube(cubeObject,intercept);
			return;  //
		}
		var rtnFunction=function(cube){
			scene.remove(cube);
			if (scene.children.length<4) animateFinish();
		};
		cubeObject.isMoving=true;
		moveCube(cubeObject,x,y,z,1500,rtnFunction);
	}
	function moveCube(cube,x,y,z,duration,rtnFunction) {
		var timeFraction=0,progress,start,end,startTime,newX,newY,newZ;
		startTime = performance.now();
		start = {x:cube.position.x,y:cube.position.y,z:cube.position.z};
		end   = {x:start.x+x,y:start.y+y,z:start.z+z};
		var animateMesh = function(time) {
			// timeFraction goes from 0 to 1
			timeFraction = (time - startTime) / duration;
			if (timeFraction > 1) timeFraction = 1;
			// calculate the current animation state
			// progress = timing(timeFraction)
			progress = timeFraction;
			//draw(progress); // draw it
			newX = start.x +(end.x-start.x)*progress;
			newY = start.y +(end.y-start.y)*progress;
			newZ = start.z +(end.z-start.z)*progress;
			cube.position.x=newX;
			cube.position.y=newY;
			cube.position.z=newZ;
			if (timeFraction < 1) {
			  requestAnimationFrame(animateMesh);
			}
			else {
				//scene.remove(cubeObject);
				rtnFunction(cube);
			}
		}
		requestAnimationFrame(animateMesh);

	}
	function cubeCanMove(boxMesh,x,y,z) {
		let ndx = boxMesh.cubeIndex;
		let intercept=true;
		for (let i=0;i<scene.children.length;i++) {
			let group = scene.children[i];
			let pos = group.cubeIndex;
			if (group.type!='Group') continue;
			if (group.isMoving==true) continue;
			if (x>0) {
				if (!(pos.y==ndx.y&&pos.z==ndx.z))continue;
				if (pos.x>ndx.x) {
					if (intercept===true) intercept=group;
					else if (pos.x<intercept.cubeIndex.x) intercept=group;
				}
			}
			if (x<0) {
				if (!(pos.y==ndx.y&&pos.z==ndx.z))continue;
				if (pos.x<ndx.x) {
					if (intercept===true) intercept=group;
					else if (pos.x>intercept.cubeIndex.x) intercept=group;
				}
			}
			if (y>0) {
				if (!(pos.x==ndx.x&&pos.z==ndx.z))continue;
				if (pos.y>ndx.y) {
					if (intercept===true) intercept=group;
					else if (pos.y<intercept.cubeIndex.y) intercept=group;
				}
			}
			if (y<0) {
				if (!(pos.x==ndx.x&&pos.z==ndx.z))continue;
				if (pos.y<ndx.y) {
					if (intercept===true) intercept=group;
					else if (pos.y>intercept.cubeIndex.y) intercept=group;
				}
			}
			if (z>0) {
				if (!(pos.x==ndx.x&&pos.y==ndx.y))continue;
				if (pos.z>ndx.z) {
					if (intercept===true) intercept=group;
					else if (pos.z<intercept.cubeIndex.z) intercept=group;
				}
			}
			if (z<0) {
				if (!(pos.x==ndx.x&&pos.y==ndx.y))continue;
				if (pos.z<ndx.z) {
					if (intercept===true) intercept=group;
					else if (pos.z>intercept.cubeIndex.z) intercept=group;
				}
			}
		}
		return intercept;
	}
	function createTestCubes(x,y,z) {
		//cubes=new Array(x).fill(new Array(y).fill(new Array(z).fill(Math.random())));
		cubes=[];
		for (var i=0;i<x;i++) {
			cubes[i]=[];
			for (var j=0;j<y;j++) {
				cubes[i][j]=[];
				for (var k=0;k<z;k++) {
					cubes[i][j][k]=[];
					var cube = {};
					cube.cubeIndex={x:i,y:j,z:k};
					cube.direction=Math.floor(Math.random()*6);
					cube.visible=true;
					cubes[i][j][k] = Object.assign({},cube);
				}
			}
		}
		cubes = findSolution(cubes,x,y,z);
		return cubes;
	}
	function createTestCircleCubes(x,y,z) {
		//cubes=new Array(x).fill(new Array(y).fill(new Array(z).fill(Math.random())));
		var center = x/2,width=x/10,show,radius=x/2-width,length;
		cubes=[];
		for (var i=0;i<x;i++) {
			cubes[i]=[];
			for (var j=0;j<y;j++) {
				cubes[i][j]=[];
				show=false;
				length = Math.pow(Math.pow((i-center),2)+Math.pow((j-center),2),0.5);
				if (length+width>radius&&length-width<radius) {
					show=true;
				}
				for (var k=0;k<z;k++) {
					cubes[i][j][k]=[];
					var cube = {};
					cube.show=show;
					cube.cubeIndex={x:i,y:j,z:k};
					cube.direction=Math.floor(Math.random()*6);
					cube.visible=show;
					cubes[i][j][k] = Object.assign({},cube);
				}
			}
		}
		cubes = findSolution(cubes,x,y,z);
		return cubes;
	}
	function createTestFrameCubes(x,y,z) {
		//cubes=new Array(x).fill(new Array(y).fill(new Array(z).fill(Math.random())));
		var center = x/2,width=x/5,show,radius=x/2-width,length;
		cubes=[];
		for (var i=0;i<x;i++) {
			cubes[i]=[];
			for (var j=0;j<y;j++) {
				cubes[i][j]=[];
				show=false;
				if (i<=width||j<=width||i>=x-width-1||j>=y-width-1) show=true;
				for (var k=0;k<z;k++) {
					cubes[i][j][k]=[];
					var cube = {};
					cube.show=show;
					cube.cubeIndex={x:i,y:j,z:k};
					cube.direction=Math.floor(Math.random()*6);
					cube.visible=show;
					cubes[i][j][k] = Object.assign({},cube);
				}
			}
		}
		cubes = findSolution(cubes,x,y,z);
		return cubes;
	}
	function findSolution(cubes,x,y,z) {
		while (!testSolution(cubes,x,y,z)) {
			// find and change a still visible cube
			var found=false;
			for (var i=0;i<x;i++) {
				for (var j=0;j<y;j++) {
					for (var k=0;k<z;k++) {
						var cube = cubes[i][j][k];
						if (cube.visible==false) continue;
						if (trappedCube(cube,cubes)) continue;
						found=true;
						cube.direction+=1;
						if (cube.direction>5) cube.direction=0;
						break;
					}
					if (found==true) break;
				}
				if (found==true) break;
			}
		}
		return cubes;
	}
	function trappedCube(cube,cubes) {
		var d = cube.direction;
		var x=cube.cubeIndex.x,y=cube.cubeIndex.y,z=cube.cubeIndex.z;
		if (d==2||d==3) { // direction is x
			if (y!=0 && z!=0 &&
				cubes[x][y-1][z-1].visible==true &&
				cubes[x][y+1][z+1].visible==true &&
				cubes[x][y-1][z+1].visible==true &&
				cubes[x][y+1][z-1].visible==true) return true;
			return false
		}
		if (d==4||d==5) { // direction is y
			if (x!=0 && z!=0 &&
				cubes[x-1][y][z-1].visible==true &&
				cubes[x+1][y][z+1].visible==true &&
				cubes[x-1][y][z+1].visible==true &&
				cubes[x+1][y][z-1].visible==true) return true;
			return false
		}
		if (d==0||d==1) { // direction is z
			if (x!=0 && y!=0 &&
				cubes[x-1][y-1][z].visible==true &&
				cubes[x+1][y+1][z].visible==true &&
				cubes[x+1][y-1][z].visible==true &&
				cubes[x-1][y+1][z].visible==true) return true;
			return false
		}
	}
	function testSolution(cubes,xx,yy,zz) {
		var cube,found,dirty=false;
		for (var l=0;l<xx*yy*zz;l++) {
			found=false;
			for (var i=0;i<xx;i++) {
				for (var j=0;j<yy;j++) {
					for (var k=0;k<zz;k++) {
						cube=cubes[i][j][k];
						if (cube.visible!=true) continue;
						var x=0,y=0,z=0;
						switch (cube.direction) {
							case 2:
								x=-20;
								break;
							case 3:
								x=20;
								break;
							case 5:
								y=-20;
								break;
							case 4:
								y=20;
								break;
							case 1:
								z=-20;
								break;
							case 0:
								z=20;
								break;
						}
						if (cubeCanMove2(cube,cubes,x,y,z,xx,yy,zz)) {
							found=true;
							cube.visible=false;
						}
						else dirty=true
					}
				}
			}
			if (found==false) break;
		}
		return !dirty;
	}
	function cubeCanMove2(cube,cubes,x,y,z,xx,yy,zz) {
		let ndx = cube.cubeIndex;
		for (var i=0;i<xx;i++) {
			for (var j=0;j<yy;j++) {
				for (var k=0;k<zz;k++) {
					if (cubes[i][j][k].visible==false) continue;
					let pos = cubes[i][j][k].cubeIndex;
					if (x>0) {
						if (!(pos.y==ndx.y&&pos.z==ndx.z))continue;
						if (pos.x>ndx.x) return false;
					}
					if (x<0) {
						if (!(pos.y==ndx.y&&pos.z==ndx.z))continue;
						if (pos.x<ndx.x) return false;
					}
					if (y>0) {
						if (!(pos.x==ndx.x&&pos.z==ndx.z))continue;
						if (pos.y>ndx.y) return false;
					}
					if (y<0) {
						if (!(pos.x==ndx.x&&pos.z==ndx.z))continue;
						if (pos.y<ndx.y) return false;
					}
					if (z>0) {
						if (!(pos.x==ndx.x&&pos.y==ndx.y))continue;
						if (pos.z>ndx.z) return false;
					}
					if (z<0) {
						if (!(pos.x==ndx.x&&pos.y==ndx.y))continue;
						if (pos.z<ndx.z) return false;
					}
				}
			}
		}
		return true;
	}
	function animateFinish() {
		var cube,timeFraction,progress,i,startTime,animateMesh;
		displayInfo.updateDisplay=false;
//				scene.position.x=0;
//				scene.position.y=0;
//				scene.position.z=0;
		controls.reset();
		controls.autoRotate=true;
		for (i=0;i<savedCubes.length;i++) {
			cube = savedCubes[i].group;
			if (cube.visible==true) scene.add(cube);
			cube.fstart = {x:cube.position.x+Math.random()*12-6,
						   y:cube.position.y+Math.random()*12-6,
						   z:cube.position.z+Math.random()*12-6}
			cube.fend   = {x:cube.cubeIndex.x,
						   y:cube.cubeIndex.y,
						   z:cube.cubeIndex.z};
		}
		startTime = performance.now();
		animateMesh = function(time) {
			// timeFraction goes from 0 to 1
			timeFraction = (time - startTime) / 9000;
			if (timeFraction > 1) timeFraction = 1;
			// calculate the current animation state
			// progress = timing(timeFraction)
			progress = timeFraction;
			//draw(progress); // draw it
			for (i=0;i<scene.children.length;i++) {
				let c = scene.children[i];
				if (c.type!='Group') continue;
				c.position.x = c.fstart.x + (c.fend.x-c.fstart.x)*progress;
				c.position.y = c.fstart.y + (c.fend.y-c.fstart.y)*progress;
				c.position.z = c.fstart.z + (c.fend.z-c.fstart.z)*progress;
			}
			if (timeFraction < 1) {
			  requestAnimationFrame(animateMesh);
			}
			else {
				var s = document.getElementById('congrat').style;
				s.display='block';
				s.top=(window.innerHeight/2-90)+"px";
				document.getElementById('canvasPage').
					addEventListener("click",function(){
					cancelAnimationFrame(animinateID);
					scene='';
					renderer="";
					controls = '';
					cubes=[];
					savedCubes=[];
					document.getElementById('renderCanvas').remove();
					document.getElementById('canvasPage').style.display='none';
					document.getElementById('page1').style.display='block';
				},{once:true});
				//scene.remove(cubeObject);
				//rtnFunction(cube);
			}
		}
		requestAnimationFrame(animateMesh);

	}
	function updateDisplay() {
		const zeroPad = (num, places) => String(num).padStart(places, '0')
		if (displayInfo.updateDisplay==false) return;
		var count = scene.children.length -3;
		if (count!=displayInfo.lastCount) {
			document.getElementById('count').innerHTML=count;
			displayInfo.lastCount=count;
		}
		var e= new Date();
		var d = new Date(e-displayInfo.startTime);
		var time=zeroPad(d.getUTCHours(),2)+":"+
				 zeroPad(d.getMinutes(),2)+":"+
				 zeroPad(d.getSeconds(),2);

		if (time!=displayInfo.oldTime) {
			displayInfo.oldTime=time;
			document.getElementById("time").innerHTML=time;
		}
	}
