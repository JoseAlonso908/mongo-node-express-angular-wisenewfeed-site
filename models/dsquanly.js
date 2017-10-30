var Model = function(mongoose) {
	
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,		
		ngayghidanh:{
			type:String
		},
		ten: {
			type: String
		},
		sdt: {
			type: String
		},	
		ngaysinh:{
			type:String
		},
		lop:{
			type:mongoose.Schema.Types.Mixed
		},	
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('dsquanly', schema);
	//CRUD 
	return {
		create: (data, callback) => {	

			ghidanh=data.ghidanh,
			ten=data.ten,
			sdt=data.sdt,
			ngaysinh=data.ngaysinh,
			lop={
				tenlop:data.tenlop,
				giohoc:data.giohoc,
				coso:data.coso,
				hocphi:data.hocphi
			}
			let item = new Model()
			Object.assign(item, {ghidanh,ten, sdt,ngaysinh,lop})
			item.save(callback)
		}
	}
}

module.exports = Model