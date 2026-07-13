export type ClockPreset = 'none' | '1+0' | '3+2' | '5+0' | '10+5' | '15+10';

export class ChessClock {
	public preset: ClockPreset = 'none';
	public wtime = 0; // ms
	public btime = 0; // ms
	public winc = 0; // ms
	public binc = 0; // ms
	public activeColor: 'white' | 'black' | null = null;
	public timerTenths = 0;
	private timerInterval: any = null;

	public onTick: ( ( wtime: number, btime: number ) => void ) | null = null;
	public onTimeOut: ( ( flaggedColor: 'white' | 'black' ) => void ) | null =
		null;

	constructor() {
		this.setPreset( 'none' );
	}

	/**
	 * Configure the clock times and increments based on the preset name.
	 * @param preset
	 */
	public setPreset( preset: ClockPreset ): void {
		this.preset = preset;
		if ( preset === '1+0' ) {
			this.wtime = 60000;
			this.btime = 60000;
			this.winc = 0;
			this.binc = 0;
		} else if ( preset === '3+2' ) {
			this.wtime = 180000;
			this.btime = 180000;
			this.winc = 2000;
			this.binc = 2000;
		} else if ( preset === '5+0' ) {
			this.wtime = 300000;
			this.btime = 300000;
			this.winc = 0;
			this.binc = 0;
		} else if ( preset === '10+5' ) {
			this.wtime = 600000;
			this.btime = 600000;
			this.winc = 5000;
			this.binc = 5000;
		} else if ( preset === '15+10' ) {
			this.wtime = 900000;
			this.btime = 900000;
			this.winc = 10000;
			this.binc = 10000;
		} else {
			this.wtime = 0;
			this.btime = 0;
			this.winc = 0;
			this.binc = 0;
		}
	}

	private lastTickTime = 0;

	/**
	 * Starts the tick interval using real-time calculation to avoid throttling issues.
	 */
	public start(): void {
		if ( this.timerInterval ) {
			return;
		}

		this.lastTickTime = performance.now();
		this.timerInterval = setInterval( () => {
			const now = performance.now();
			const elapsed = now - this.lastTickTime;
			this.lastTickTime = now;

			// Increment game total duration roughly by the interval steps
			this.timerTenths += Math.round( elapsed / 100 );

			if ( this.preset !== 'none' && this.activeColor ) {
				if ( this.activeColor === 'white' ) {
					this.wtime = Math.max( 0, this.wtime - elapsed );
					if ( this.wtime <= 0 ) {
						this.stop();
						if ( this.onTimeOut ) {
							this.onTimeOut( 'white' );
						}
					}
				} else {
					this.btime = Math.max( 0, this.btime - elapsed );
					if ( this.btime <= 0 ) {
						this.stop();
						if ( this.onTimeOut ) {
							this.onTimeOut( 'black' );
						}
					}
				}
			}

			if ( this.onTick ) {
				this.onTick( this.wtime, this.btime );
			}
		}, 100 );
	}

	/**
	 * Stops the tick interval.
	 */
	public stop(): void {
		if ( this.timerInterval ) {
			clearInterval( this.timerInterval );
			this.timerInterval = null;
		}
	}

	/**
	 * Resets the timer counter and stops the interval.
	 */
	public reset(): void {
		this.stop();
		this.timerTenths = 0;
		this.activeColor = null;
	}

	/**
	 * Set the currently active clock color.
	 * @param color
	 */
	public setActiveColor( color: 'white' | 'black' | null ): void {
		this.activeColor = color;
	}

	/**
	 * Applies the Fischer increment after a player completes their move.
	 * @param justFinishedColor
	 * @param plyCount
	 */
	public applyIncrement(
		justFinishedColor: 'white' | 'black',
		plyCount: number
	): void {
		if ( this.preset === 'none' ) {
			return;
		}
		if ( plyCount <= 1 ) {
			return;
		}

		if ( justFinishedColor === 'white' ) {
			this.wtime += this.winc;
			// Bonus time at move 40 (+30s) is only applied if explicitly supported by a custom/classic cadence preset.
			if ( this.preset === ( 'classic' as any ) && plyCount === 80 ) {
				this.wtime += 30000;
			}
		} else {
			this.btime += this.binc;
			if ( this.preset === ( 'classic' as any ) && plyCount === 81 ) {
				this.btime += 30000;
			}
		}
	}

	/**
	 * Formats milliseconds to mm:ss format, or ss.d format when under 10 seconds.
	 * @param timeMs
	 */
	public static formatTime( timeMs: number ): string {
		if ( timeMs <= 0 ) {
			return '00:00';
		}
		const totalSeconds = timeMs / 1000;
		const minutes = Math.floor( totalSeconds / 60 );
		const seconds = Math.floor( totalSeconds % 60 );

		if ( totalSeconds < 10 ) {
			const tenths = Math.floor( ( timeMs % 1000 ) / 100 );
			return `${ seconds }.${ tenths }`;
		}

		return `${ minutes.toString().padStart( 2, '0' ) }:${ seconds
			.toString()
			.padStart( 2, '0' ) }`;
	}
}
